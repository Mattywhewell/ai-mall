#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
    const char *path = "/lib/x86_64-linux-gnu/libtss2-tcti-swtpm.so.0";
    const char *conf = argc>1 ? argv[1] : "swtpm:socket=/tmp/swtpm-sock";
    printf("CALLER: dlopen(%s)\n", path);
    fflush(stdout);
    void *h = dlopen(path, RTLD_NOW);
    if (!h) {
        printf("dlopen: NULL, dlerror=%s\n", dlerror());
        return 2;
    }
    printf("dlopen: handle=%p\n", h);

    void *sym = dlsym(h, "Tss2_Tcti_Swtpm_Init");
    char *derr = dlerror();
    if (!sym || derr) {
        printf("dlsym(Tss2_Tcti_Swtpm_Init): NULL, dlerror=%s\n", derr?derr:"(none)");
        return 3;
    }
    printf("dlsym: ptr=%p\n", sym);

    typedef int (*init_fn_t)(void **, const char *);
    init_fn_t init = (init_fn_t)sym;
    void *ctx = NULL;
    printf("Calling init with conf='%s'\n", conf);
    fflush(stdout);
    int rc = init(&ctx, conf);
    printf("init returned %d, ctx=%p\n", rc, ctx);
    fflush(stdout);
    return rc;
}
