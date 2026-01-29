#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <sys/wait.h>
#include <unistd.h>

int main(int argc, char **argv) {
    const char *path = "/lib/x86_64-linux-gnu/libtss2-tcti-swtpm.so.0";
    printf("PROBE: dlopen(%s)\n", path);
    fflush(stdout);

    void *h = dlopen(path, RTLD_NOW);
    if (!h) {
        printf("dlopen: NULL, dlerror=%s\n", dlerror());
        return 2;
    }
    printf("dlopen: handle=%p\n", h);

    // list dynamic symbols and pick candidates
    char cmd[512];
    snprintf(cmd, sizeof(cmd), "nm -D %s 2>/dev/null | grep -Ei 'init|swtpm|Tss2_Tcti' | sed -E 's/^[^ ]+ +[A-Za-z] +//' | sort -u", path);
    FILE *p = popen(cmd, "r");
    if (!p) {
        perror("popen");
        return 3;
    }

    char sym[512];
    int found = 0;
    while (fgets(sym, sizeof(sym), p)) {
        // trim
        char *s = sym; while(*s && (*s==' '||*s=='\t')) s++;
        char *e = s + strlen(s) - 1; while(e> s && (*e=='\n'||*e=='\r'||*e==' '||*e=='\t')) *e--=0;
        if (strlen(s)==0) continue;
        found = 1;
        printf("CANDIDATE: %s\n", s);

        // dlsym
        dlerror();
        void *symptr = dlsym(h, s);
        char *derr = dlerror();
        if (!symptr || derr) {
            printf("dlsym(%s): NULL, dlerror=%s\n", s, derr ? derr : "(none)");
            continue;
        }
        printf("dlsym(%s): ptr=%p\n", s, symptr);

        // By default, call it in a child so any crash/UB doesn't kill the probe
        // If PROBE_SINGLE_PROCESS is set, call inline so gdb (attached to this process) can capture a backtrace
        char *single = getenv("PROBE_SINGLE_PROCESS");
        if (single && strcmp(single, "1")==0) {
            typedef int (*initfn_t)(void);
            initfn_t f = (initfn_t)symptr;
            fflush(stdout);
            int rc = f();
            printf("CALL(%s) returned %d\n", s, rc);
            fflush(stdout);
        } else {
            pid_t pid = fork();
            if (pid == 0) {
                // child
                typedef int (*initfn_t)(void);
                initfn_t f = (initfn_t)symptr;
                fflush(stdout);
                int rc = f();
                printf("CALL(%s) returned %d\n", s, rc);
                fflush(stdout);
                _exit(rc & 0xff);
            } else if (pid > 0) {
                int status = 0;
                waitpid(pid, &status, 0);
                if (WIFEXITED(status)) {
                    printf("child exit status: %d\n", WEXITSTATUS(status));
                } else if (WIFSIGNALED(status)) {
                    printf("child killed by signal: %d\n", WTERMSIG(status));
                } else {
                    printf("child stopped/unknown status: %d\n", status);
                }
            } else {
                perror("fork");
            }
        }
    }
    pclose(p);

    if (!found) {
        printf("No candidate symbols found matching heuristics.\n");
    }

    // Also try some heuristic names in case nm didn't list them exactly
    const char *heuristics[] = {"swtpm_tcti_init","tcti_swtpm_init","swtpm_tcti_initialize","swtpm_tcti_construct","swtpm_init","tcti_init","Tss2_TctiSwtpm_Init","Tss2_Tcti_Swtpm_Init", NULL};
    for (const char **hs = heuristics; *hs; ++hs) {
        dlerror();
        void *symptr = dlsym(h, *hs);
        char *derr = dlerror();
        printf("HEURISTIC dlsym(%s): ptr=%p dlerror=%s\n", *hs, symptr, derr?derr:"(none)");
        if (symptr) {
            pid_t pid = fork();
            if (pid == 0) {
                typedef int (*initfn_t)(void);
                initfn_t f = (initfn_t)symptr;
                int rc = f();
                printf("CALL(%s) returned %d\n", *hs, rc);
                fflush(stdout);
                _exit(rc & 0xff);
            } else if (pid > 0) {
                int status = 0;
                waitpid(pid, &status, 0);
                if (WIFEXITED(status)) printf("child exit status: %d\n", WEXITSTATUS(status));
                else if (WIFSIGNALED(status)) printf("child killed by signal: %d\n", WTERMSIG(status));
                else printf("child stopped/unknown status: %d\n", status);
            }
        }
    }

    dlclose(h);
    printf("done\n");
    return 0;
}
