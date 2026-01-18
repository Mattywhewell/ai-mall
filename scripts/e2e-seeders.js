// Helper: deterministic E2E user + role seeding
// Exported so it can be unit tested

async function ensureTestUsers(supabase, { password = process.env.E2E_TEST_USER_PASSWORD || 'Password123!', log = console } = {}) {
  const TEST_USERS = [
    { email: 'e2e-admin+ci@example.com', role: 'admin' },
    { email: 'e2e-supplier+ci@example.com', role: 'supplier' },
    { email: 'e2e-standard+ci@example.com', role: 'standard' },
  ];

  // Fetch existing auth users once (we'll re-list after creates)
  const listUsers = async () => {
    const res = await supabase.auth.admin.listUsers();
    // supabase-js returns { data: { users: [...] } } in some clients; normalize
    return (res && res.data && res.data.users) || res.users || res.data || [];
  };

  let existingUsers = await listUsers();

  for (const u of TEST_USERS) {
    let found = existingUsers.find(x => x && x.email && x.email.toLowerCase() === u.email.toLowerCase());
    if (!found) {
      log.log(`🔁 Creating test auth user: ${u.email}`);
      // Try up to 3 times to create the user to handle transient DB/auth errors
      let createRes;
      let attempt = 0;
      while (attempt < 3) {
        attempt++;
        try {
          createRes = await supabase.auth.admin.createUser({
            email: u.email,
            password,
            email_confirm: true,
          });
        } catch (err) {
          // Network or unexpected exception
          log.error(`Attempt ${attempt}: unexpected error calling createUser: ${err && (err.message || err)}`);
          createRes = createRes || { error: err };
        }
        if (createRes && createRes.error) {
          log.error(`Attempt ${attempt}: createUser error:`, createRes.error);
          // small backoff
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        break;
      }

      if (createRes && createRes.error) {
        // Log full response for diagnosis
        log.error('Full createUser response:', JSON.stringify(createRes, null, 2));
        throw new Error('Database error creating new user: ' + (createRes.error && (createRes.error.message || createRes.error)));
      }

      // Re-list users so we can get the new user's id
      existingUsers = await listUsers();
      found = existingUsers.find(x => x && x.email && x.email.toLowerCase() === u.email.toLowerCase());
      if (!found) {
        throw new Error(`Unable to create or find user ${u.email} in auth.users`);
      }
      log.log(`✅ Created auth user ${u.email} (id=${found.id})`);
    } else {
      log.log(`✅ Auth user ${u.email} already exists (id=${found.id})`);
    }

    // Ensure a role entry in user_roles
    try {
      const { data: rolesData, error: roleErr } = await supabase.from('user_roles').select('id,role').eq('user_id', found.id).limit(1);
      if (roleErr) {
        // If the user_roles table isn't queryable, surface the error
        throw roleErr;
      }
      if (!rolesData || rolesData.length === 0) {
        log.log(`🔁 Inserting role '${u.role}' for user ${u.email}`);
        const { error: insertErr } = await supabase.from('user_roles').insert({ user_id: found.id, role: u.role });
        if (insertErr && insertErr.code !== '23505') {
          throw insertErr;
        }
        log.log(`✅ Role '${u.role}' added for ${u.email}`);
      } else {
        log.log(`✅ Role already present for ${u.email} (role=${rolesData[0].role})`);
      }
    } catch (err) {
      // Re-throw so callers can handle CI-vs-local
      throw err;
    }
  }

  return true;
}

module.exports = { ensureTestUsers };
