
/* =========================================
   CHAT ESSENTIALS - SUPABASE BRIDGE
   ========================================= */

(function () {
    "use strict";

    const config = window.CHAT_ESSENTIALS_SUPABASE;

    if (!config || !config.url || !config.publishableKey) {
        console.error("Supabase configuration is missing.");
        return;
    }

    if (!window.supabase || !window.supabase.createClient) {
        console.error("Supabase library was not loaded.");
        return;
    }

    const client = window.supabase.createClient(
        config.url,
        config.publishableKey
    );

    let realtimeChannel = null;

    /* =====================================
       AUTHENTICATION
       ===================================== */

    async function signIn(email, password) {
        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password
        });

        if (error) throw error;

        return data;
    }

    async function signUp(email, password) {
        const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password
        });

        if (error) throw error;

        return data;
    }

    async function signOut() {
        stopRealtime();

        const { error } = await client.auth.signOut();

        if (error) throw error;
    }

    async function getSession() {
        const { data, error } = await client.auth.getSession();

        if (error) throw error;

        return data.session;
    }

    async function getCurrentUser() {
        const { data, error } = await client.auth.getUser();

        if (error) throw error;

        return data.user;
    }

    /* =====================================
       SHARED DATABASE
       Table: public.app_shared_data

       Columns:
       data_key
       data_value
       updated_by
       updated_at
       ===================================== */

    async function loadAll() {
        const { data, error } = await client
            .from("app_shared_data")
            .select("data_key, data_value, updated_at");

        if (error) throw error;

        const result = {};

        for (const row of data || []) {
            result[row.data_key] = row.data_value;
        }

        return result;
    }

    async function get(key) {
        const { data, error } = await client
            .from("app_shared_data")
            .select("data_value")
            .eq("data_key", key)
            .maybeSingle();

        if (error) throw error;

        return data ? data.data_value : null;
    }

    async function save(key, value) {
        const user = await getCurrentUser();

        if (!user) {
            throw new Error("Please sign in before saving data.");
        }

        const { data, error } = await client
            .from("app_shared_data")
            .upsert(
                {
                    data_key: key,
                    data_value: value,
                    updated_by: user.id,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "data_key"
                }
            )
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async function remove(key) {
        const { error } = await client
            .from("app_shared_data")
            .delete()
            .eq("data_key", key);

        if (error) throw error;
    }

    /* =====================================
       REALTIME
       ===================================== */

    function startRealtime(callback) {
        stopRealtime();

        realtimeChannel = client
            .channel("chat-essentials-shared-data")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "app_shared_data"
                },
                payload => {
                    if (typeof callback === "function") {
                        callback(payload);
                    }

                    window.dispatchEvent(
                        new CustomEvent("chatEssentialsCloudChange", {
                            detail: payload
                        })
                    );
                }
            )
            .subscribe();

        return realtimeChannel;
    }

    function stopRealtime() {
        if (realtimeChannel) {
            client.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
    }

    /* =====================================
       AUTH STATE LISTENER
       ===================================== */

    function onAuthStateChange(callback) {
        return client.auth.onAuthStateChange(
            (event, session) => {
                if (typeof callback === "function") {
                    callback(event, session);
                }
            }
        );
    }

    /* =====================================
       PUBLIC API
       ===================================== */

    window.ChatEssentialsCloud = {
        client,
        signIn,
        signUp,
        signOut,
        getSession,
        getCurrentUser,
        loadAll,
        get,
        save,
        remove,
        startRealtime,
        stopRealtime,
        onAuthStateChange
    };

    console.log("Chat Essentials Supabase bridge loaded.");

})();
