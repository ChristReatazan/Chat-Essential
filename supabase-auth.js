
/* =========================================
   CHAT ESSENTIALS - ROLE-BASED AUTHENTICATION
   ========================================= */

(function () {
    "use strict";

    const cloud = window.ChatEssentialsCloud;

    if (!cloud) {
        console.error("Supabase bridge is not available.");
        return;
    }

    const POP_PAGE = "pop-validation.html";

    let isCheckingAccess = false;
    let currentUser = null;

    /* =========================================
       STYLES
       ========================================= */

    const style = document.createElement("style");

    style.textContent = `
        #ce-account-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            padding: 12px 16px;
            margin: 12px 0;
            background: #111827;
            color: #fff;
            border: 1px solid #374151;
            border-radius: 10px;
            font-family: Arial, sans-serif;
        }

        #ce-account-bar button,
        #ce-auth-panel button {
            padding: 9px 15px;
            border: 0;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }

        #ce-login-button {
            background: #2563eb;
            color: white;
        }

        #ce-logout-button {
            background: #dc2626;
            color: white;
        }

        #ce-auth-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #080d18;
        }

        #ce-auth-panel {
            box-sizing: border-box;
            width: 100%;
            max-width: 390px;
            padding: 28px;
            color: #fff;
            background: #111827;
            border: 1px solid #475569;
            border-radius: 14px;
            box-shadow: 0 15px 50px rgba(0,0,0,.4);
            font-family: Arial, sans-serif;
        }

        #ce-auth-panel h2 {
            margin-top: 0;
            margin-bottom: 8px;
        }

        #ce-auth-panel p {
            color: #cbd5e1;
            font-size: 13px;
            line-height: 1.5;
        }

        #ce-auth-panel input {
            box-sizing: border-box;
            display: block;
            width: 100%;
            margin: 12px 0;
            padding: 12px;
            color: #111827;
            background: #fff;
            border: 1px solid #64748b;
            border-radius: 6px;
        }

        #ce-auth-actions {
            display: flex;
            gap: 8px;
            margin-top: 16px;
        }

        #ce-auth-actions button {
            flex: 1;
        }

        #ce-signin-button {
            color: white;
            background: #2563eb;
        }

        #ce-signup-button {
            color: white;
            background: #475569;
        }

        #ce-auth-message {
            min-height: 20px;
            margin-top: 14px;
            overflow-wrap: anywhere;
        }

        #ce-auth-status {
            font-size: 13px;
            color: #cbd5e1;
        }

        #ce-access-role {
            color: #93c5fd;
            font-size: 12px;
            margin-top: 4px;
        }
    `;

    document.head.appendChild(style);

    /* =========================================
       ACCOUNT BAR
       ========================================= */

    const accountBar = document.createElement("div");
    accountBar.id = "ce-account-bar";

    accountBar.innerHTML = `
        <div>
            <strong>CHAT ESSENTIALS ACCOUNT</strong>
            <div id="ce-auth-status">Checking account...</div>
            <div id="ce-access-role"></div>
        </div>

        <div>
            <button id="ce-login-button" type="button">
                SIGN IN
            </button>

            <button id="ce-logout-button"
                type="button"
                style="display:none">
                SIGN OUT
            </button>
        </div>
    `;

    /* =========================================
       LOGIN PANEL
       ========================================= */

    const overlay = document.createElement("div");
    overlay.id = "ce-auth-overlay";

    overlay.innerHTML = `
        <div id="ce-auth-panel">

            <h2>CHAT ESSENTIALS</h2>

            <p id="ce-auth-description">
                Sign in to access your account.
            </p>

            <input
                id="ce-auth-email"
                type="email"
                placeholder="Email address"
                autocomplete="email">

            <input
                id="ce-auth-password"
                type="password"
                placeholder="Password"
                autocomplete="current-password">

            <div id="ce-auth-actions">

                <button id="ce-signin-button" type="button">
                    SIGN IN
                </button>

                <button id="ce-signup-button" type="button">
                    REGISTER AS AGENT
                </button>

            </div>

            <p id="ce-auth-message"></p>

        </div>
    `;

    /* =========================================
       HELPER FUNCTIONS
       ========================================= */

    function showMessage(message, isError) {
        const element = document.getElementById("ce-auth-message");

        if (!element) return;

        element.textContent = message;
        element.style.color = isError ? "#fca5a5" : "#86efac";
    }

    function setDescription(message) {
        const element = document.getElementById("ce-auth-description");

        if (element) {
            element.textContent = message;
        }
    }

    function showLogin() {
        overlay.style.display = "flex";
    }

    function hideLogin() {
        overlay.style.display = "none";
    }

    function isPopPage() {
        return window.location.pathname
            .toLowerCase()
            .endsWith(POP_PAGE);
    }

    /* =========================================
       ROLE-BASED NAVIGATION VISIBILITY
       ========================================= */

    function updateNavigationVisibility(roleData) {

        const backToChatButton =
            document.getElementById("ce-back-to-chat");

        if (!backToChatButton) return;

        const isAdmin =
            roleData &&
            roleData.role === "admin" &&
            roleData.approval_status === "approved";

        if (isAdmin) {

            // Restore the original CSS styling.
            backToChatButton.style.removeProperty("display");

        } else {

            // Hide the button for non-admin accounts.
            backToChatButton.style.setProperty(
                "display",
                "none",
                "important"
            );
        }
    }

    /* =========================================
       ACCOUNT BAR UPDATE
       ========================================= */

    function updateAccountBar(session, roleData) {

        const status = document.getElementById("ce-auth-status");
        const roleLabel = document.getElementById("ce-access-role");
        const loginButton = document.getElementById("ce-login-button");
        const logoutButton = document.getElementById("ce-logout-button");

        if (session && session.user) {

            status.textContent = "Signed in as " + session.user.email;

            loginButton.style.display = "none";
            logoutButton.style.display = "inline-block";

            if (roleData) {
                roleLabel.textContent =
                    roleData.role.toUpperCase() +
                    " | " +
                    roleData.approval_status.toUpperCase();
            } else {
                roleLabel.textContent = "";
            }

        } else {

            status.textContent = "Not signed in";
            roleLabel.textContent = "";

            loginButton.style.display = "inline-block";
            logoutButton.style.display = "none";
        }
    }

    /* =========================================
       LOAD USER ROLE FROM SUPABASE
       ========================================= */

    async function getUserRole(userId) {

        const { data, error } = await cloud.client
            .from("user_roles")
            .select("role, approval_status")
            .eq("user_id", userId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    }

    /* =========================================
       ACCESS CONTROL
       ========================================= */

    async function checkAccess(session) {

        if (isCheckingAccess) return;

        isCheckingAccess = true;

        try {

            if (!session || !session.user) {

                currentUser = null;

                updateAccountBar(null, null);
                updateNavigationVisibility(null);

                setDescription("Sign in to access your account.");
                showMessage("", false);
                showLogin();

                return;
            }

            currentUser = session.user;

            updateAccountBar(session, null);
            updateNavigationVisibility(null);

            setDescription("Verifying your account permissions...");
            showMessage("", false);

            // Keep existing session login overlay hidden.
            const roleData = await getUserRole(session.user.id);

            if (!roleData) {

                updateAccountBar(session, null);
                updateNavigationVisibility(null);

                setDescription("Account access unavailable.");

                showMessage(
                    "No account role was found. Please contact your administrator.",
                    true
                );

                showLogin();

                return;
            }

            const role = roleData.role;
            const approval = roleData.approval_status;

            updateAccountBar(session, roleData);
            updateNavigationVisibility(roleData);

            /* =================================
               ADMIN ACCESS
               ================================= */

            if (role === "admin" && approval === "approved") {

                hideLogin();

                if (isPopPage()) {
                    console.log("Admin access granted to POP Validation.");
                } else {
                    console.log("Admin access granted to Chat Essentials.");
                }

                return;
            }

            /* =================================
               SUPPORT AGENT ACCESS
               ================================= */

            if (role === "support_agent") {

                // Pending agent
                if (approval === "pending") {

                    updateNavigationVisibility(null);

                    setDescription(
                        "Your account is awaiting administrator approval."
                    );

                    showMessage(
                        "Your Support Agent account is pending approval. You cannot access the system yet.",
                        true
                    );

                    showLogin();

                    return;
                }

                // Rejected agent
                if (approval === "rejected") {

                    updateNavigationVisibility(null);

                    setDescription(
                        "Your account has not been approved."
                    );

                    showMessage(
                        "Your Support Agent application was rejected. Please contact your administrator.",
                        true
                    );

                    showLogin();

                    return;
                }

                // Approved agent
                if (approval === "approved") {

                    updateNavigationVisibility(null);

                    if (isPopPage()) {

                        hideLogin();

                        console.log(
                            "Approved Support Agent: POP access granted."
                        );

                        return;
                    }

                    showMessage(
                        "Your account is approved. Redirecting to POP Validation...",
                        false
                    );

                    window.location.replace(POP_PAGE);

                    return;
                }
            }

            /* =================================
               UNKNOWN ROLE / ACCESS DENIED
               ================================= */

            updateNavigationVisibility(null);

            setDescription("Account access denied.");

            showMessage(
                "Your account does not have permission to access this application.",
                true
            );

            showLogin();

        } catch (error) {

            console.error("Access verification failed:", error);

            updateNavigationVisibility(null);

            setDescription("Unable to verify your account.");

            showMessage(
                error.message || "Could not verify your account permissions.",
                true
            );

            showLogin();

        } finally {

            isCheckingAccess = false;
        }
    }

    /* =========================================
       SIGN IN
       ========================================= */

    async function handleSignIn() {

        const email = document.getElementById("ce-auth-email").value.trim();
        const password = document.getElementById("ce-auth-password").value;

        if (!email || !password) {

            showMessage("Enter your email and password.", true);
            return;
        }

        showMessage("Signing in...", false);

        try {

            const result = await cloud.signIn(email, password);

            await checkAccess(result.session);

        } catch (error) {

            showMessage(
                error.message || "Unable to sign in.",
                true
            );
        }
    }

    /* =========================================
       SUPPORT AGENT REGISTRATION
       ========================================= */

    async function handleSignUp() {

        const email = document.getElementById("ce-auth-email").value.trim();
        const password = document.getElementById("ce-auth-password").value;

        if (!email || !password) {

            showMessage("Enter your email and password.", true);
            return;
        }

        if (password.length < 6) {

            showMessage(
                "Password must be at least 6 characters.",
                true
            );

            return;
        }

        showMessage("Registering Support Agent account...", false);

        try {

            const result = await cloud.signUp(email, password);

            if (result.session) {

                await checkAccess(result.session);

            } else {

                setDescription("Registration submitted.");

                showMessage(
                    "Your account has been created. Check your email to confirm it. Your Support Agent access will remain pending until an administrator approves it.",
                    false
                );
            }

        } catch (error) {

            showMessage(
                error.message || "Unable to create account.",
                true
            );
        }
    }

    /* =========================================
       SIGN OUT
       ========================================= */

    async function handleSignOut() {

        try {

            await cloud.signOut();

            currentUser = null;

            updateAccountBar(null, null);
            updateNavigationVisibility(null);

            setDescription("Sign in to access your account.");
            showMessage("You have signed out.", false);

            showLogin();

        } catch (error) {

            alert(error.message || "Unable to sign out.");
        }
    }

    /* =========================================
       INITIALIZATION
       ========================================= */

    document.addEventListener("DOMContentLoaded", async function () {

        const container = document.querySelector(".container");

        if (container) {
            container.prepend(accountBar);
        } else {
            document.body.prepend(accountBar);
        }

        document.body.appendChild(overlay);

        // Hide Back to Chat until role verification completes.
        updateNavigationVisibility(null);

        document.getElementById("ce-login-button")
            .addEventListener("click", showLogin);

        document.getElementById("ce-logout-button")
            .addEventListener("click", handleSignOut);

        document.getElementById("ce-signin-button")
            .addEventListener("click", handleSignIn);

        document.getElementById("ce-signup-button")
            .addEventListener("click", handleSignUp);

        document.getElementById("ce-auth-password")
            .addEventListener("keydown", function (event) {

                if (event.key === "Enter") {
                    handleSignIn();
                }
            });

        try {

            const session = await cloud.getSession();

            await checkAccess(session);

        } catch (error) {

            console.error("Session check failed:", error);

            updateAccountBar(null, null);
            updateNavigationVisibility(null);

            setDescription("Unable to check your session.");

            showMessage(
                error.message || "Could not check your session.",
                true
            );

            showLogin();
        }

        cloud.onAuthStateChange(function (event, session) {

            if (event === "SIGNED_OUT") {

                currentUser = null;
                checkAccess(null);

                return;
            }

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {

                if (!currentUser || currentUser.id !== session?.user?.id) {
                    checkAccess(session);
                }
            }
        });
    });

})();
