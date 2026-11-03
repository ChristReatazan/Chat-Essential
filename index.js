let currentDate = new Date();
let selectedDate = null;


/* ========================================= */
/* LOCAL STORAGE DATA */
/* ========================================= */

let tasks =
    JSON.parse(localStorage.getItem("myDailyTasks")) || {};

let documentationData =
    JSON.parse(localStorage.getItem("documentationData")) || [];

let customTemplates =
    JSON.parse(localStorage.getItem("customTemplates")) || [];

let customSpiels =
    JSON.parse(localStorage.getItem("customSpiels")) || [];


/* ========================================= */
/* RN CREATION DATA */
/* ========================================= */

let rnCreationHistory =
    JSON.parse(
        localStorage.getItem("rnCreationHistory") || "[]"
    );


/* ========================================= */
/* INFORMATION DATA */
/* ========================================= */

let informationEmails =
    JSON.parse(localStorage.getItem("informationEmails")) || [
        {
            email: "privacy.officer@acer.com"
        },
        {
            email: "acerstore.aca@acer.com"
        }
    ];

let informationPhones =
    JSON.parse(localStorage.getItem("informationPhones")) || [
        {
            label: "Technical Support",
            region: "AU",
            phone: "1300 365 100"
        }
    ];


/* ========================================= */
/* SAVE DEFAULT INFORMATION */
/* ========================================= */

if (!localStorage.getItem("informationEmails")) {

    localStorage.setItem(
        "informationEmails",
        JSON.stringify(informationEmails)
    );

}

if (!localStorage.getItem("informationPhones")) {

    localStorage.setItem(
        "informationPhones",
        JSON.stringify(informationPhones)
    );

}


/* ========================================= */
/* BIBLE VERSES */
/* ========================================= */

const bibleVerses = [

    [
        "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
        "Joshua 1:9"
    ],

    [
        "I can do all this through him who gives me strength.",
        "Philippians 4:13"
    ],

    [
        "The Lord is my shepherd, I lack nothing.",
        "Psalm 23:1"
    ],

    [
        "Trust in the Lord with all your heart and lean not on your own understanding.",
        "Proverbs 3:5"
    ],

    [
        "This is the day the Lord has made; let us rejoice and be glad in it.",
        "Psalm 118:24"
    ],

    [
        "Cast all your anxiety on him because he cares for you.",
        "1 Peter 5:7"
    ],

    [
        "The Lord is my strength and my shield; my heart trusts in him.",
        "Psalm 28:7"
    ],

    [
        "Commit to the Lord whatever you do, and he will establish your plans.",
        "Proverbs 16:3"
    ],

    [
        "Let all that you do be done in love.",
        "1 Corinthians 16:14"
    ],

    [
        "The Lord bless you and keep you.",
        "Numbers 6:24"
    ],

    [
        "For nothing will be impossible with God.",
        "Luke 1:37"
    ],

    [
        "Give thanks to the Lord, for he is good; his love endures forever.",
        "Psalm 107:1"
    ],

    [
        "My grace is sufficient for you, for my power is made perfect in weakness.",
        "2 Corinthians 12:9"
    ],

    [
        "Do not worry about tomorrow, for tomorrow will worry about itself.",
        "Matthew 6:34"
    ],

    [
        "The Lord gives strength to his people; the Lord blesses his people with peace.",
        "Psalm 29:11"
    ],

    [
        "Those who hope in the Lord will renew their strength.",
        "Isaiah 40:31"
    ],

    [
        "Be still, and know that I am God.",
        "Psalm 46:10"
    ],

    [
        "The Lord is good, a refuge in times of trouble. He cares for those who trust in him.",
        "Nahum 1:7"
    ],

    [
        "A cheerful heart is good medicine.",
        "Proverbs 17:22"
    ],

    [
        "Whatever you do, work at it with all your heart.",
        "Colossians 3:23"
    ],

    [
        "The Lord is near to all who call on him.",
        "Psalm 145:18"
    ],

    [
        "With God all things are possible.",
        "Matthew 19:26"
    ],

    [
        "The peace of God, which transcends all understanding, will guard your hearts and your minds.",
        "Philippians 4:7"
    ],

    [
        "The Lord will fight for you; you need only to be still.",
        "Exodus 14:14"
    ],

    [
        "Rejoice in hope, be patient in tribulation, be constant in prayer.",
        "Romans 12:12"
    ],

    [
        "God is our refuge and strength, an ever-present help in trouble.",
        "Psalm 46:1"
    ],

    [
        "The steps of a good man are ordered by the Lord.",
        "Psalm 37:23"
    ],

    [
        "Let us not become weary in doing good.",
        "Galatians 6:9"
    ],

    [
        "The Lord is my light and my salvation—whom shall I fear?",
        "Psalm 27:1"
    ],

    [
        "In all your ways acknowledge him, and he will make your paths straight.",
        "Proverbs 3:6"
    ],

    [
        "I have set the Lord always before me. Because he is at my right hand, I will not be shaken.",
        "Psalm 16:8"
    ]

];


/* ========================================= */
/* DATE FUNCTIONS */
/* ========================================= */

function formatDate(date) {

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );

}


function getTodayKey() {

    return formatDate(new Date());

}


function isPastDate(key) {

    return key < getTodayKey();

}


/* ========================================= */
/* DAILY TASKS */
/* ========================================= */

function createDailyTasks(key) {

    if (!tasks[key]) {

        tasks[key] = {

            retailPending: false,

            rightNow: [],

            eod: false,

            popValidation: [],

            noPop: false

        };

    }

    if (!tasks[key].rightNow) {

        tasks[key].rightNow = [];

    }

    if (!tasks[key].popValidation) {

        tasks[key].popValidation = [];

    }

    if (typeof tasks[key].noPop !== "boolean") {

        tasks[key].noPop = false;

    }

}


/* ========================================= */
/* PROGRESS */
/* ========================================= */

function calculateSectionProgress(key, section) {

    createDailyTasks(key);

    let d = tasks[key];


    if (section === "retail") {

        return d.retailPending ? 100 : 0;

    }


    if (section === "eod") {

        return d.eod ? 100 : 0;

    }


    if (section === "rightnow") {

        if (!d.rightNow.length) {

            return 0;

        }

        return Math.round(
            d.rightNow.filter(
                x => x.completed
            ).length /
            d.rightNow.length *
            100
        );

    }


    if (section === "pop") {

        if (d.noPop) {

            return 100;

        }

        if (!d.popValidation.length) {

            return 0;

        }

        return Math.round(
            d.popValidation.filter(
                x => x.completed
            ).length /
            d.popValidation.length *
            100
        );

    }

    return 0;

}


function calculateProgress(key) {

    return Math.round(

        (
            calculateSectionProgress(key, "retail") +
            calculateSectionProgress(key, "rightnow") +
            calculateSectionProgress(key, "eod") +
            calculateSectionProgress(key, "pop")
        ) / 4

    );

}


/* ========================================= */
/* CALENDAR */
/* ========================================= */

function renderCalendar() {

    let calendar =
        document.getElementById("calendar");

    calendar.innerHTML = "";


    let year = currentDate.getFullYear();

    let month = currentDate.getMonth();


    const months = [
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER"
    ];


    document.getElementById("monthYear").textContent =
        months[month] + " " + year;


    let firstDay =
        new Date(year, month, 1).getDay();

    let days =
        new Date(year, month + 1, 0).getDate();


    let today = getTodayKey();


    for (let i = 0; i < firstDay; i++) {

        calendar.appendChild(
            document.createElement("div")
        );

    }


    for (let day = 1; day <= days; day++) {

        let key =
            formatDate(
                new Date(year, month, day)
            );


        let date =
            document.createElement("div");


        date.className = "date";

        date.textContent = day;


        if (key === today) {

            date.classList.add("today");

        }


        if (key === selectedDate) {

            date.classList.add("selected");

        }


        if (key < today) {

            date.classList.add("past-date");

        }


        if (tasks[key]) {

            let progress =
                calculateProgress(key);


            if (progress === 100) {

                let indicator =
                    document.createElement("div");

                indicator.className =
                    "task-indicator completed-indicator";

                indicator.textContent =
                    "✓ DONE";

                date.appendChild(indicator);

            }

            else if (progress > 0) {

                let indicator =
                    document.createElement("div");

                indicator.className =
                    "task-indicator unfinished-indicator";

                indicator.textContent =
                    progress + "%";

                date.appendChild(indicator);

            }

        }


        date.onclick = () => openTasks(key);

        calendar.appendChild(date);

    }

}


function previousMonth() {

    currentDate.setMonth(
        currentDate.getMonth() - 1
    );

    renderCalendar();

}


function nextMonth() {

    currentDate.setMonth(
        currentDate.getMonth() + 1
    );

    renderCalendar();

}


/* ========================================= */
/* TASK MODAL */
/* ========================================= */

function openTasks(key) {

    selectedDate = key;

    createDailyTasks(key);


    let date =
        new Date(key + "T00:00:00");


    document.getElementById(
        "selectedDateTitle"
    ).textContent =
        date.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );


    let panel =
        document.getElementById("taskPanel");


    if (isPastDate(key)) {

        panel.classList.add("past-view");

    }
    else {

        panel.classList.remove("past-view");

    }


    loadDailyTasks();


    document.getElementById(
        "overlay"
    ).style.display = "block";


    panel.style.display = "block";


    renderCalendar();

}


function closeTasks() {

    document.getElementById(
        "overlay"
    ).style.display = "none";


    document.getElementById(
        "taskPanel"
    ).style.display = "none";

}


/* ========================================= */
/* LOAD DAILY TASKS */
/* ========================================= */

function loadDailyTasks() {

    createDailyTasks(selectedDate);

    let d = tasks[selectedDate];


    document.getElementById(
        "retailCheckbox"
    ).checked = d.retailPending;


    document.getElementById(
        "eodCheckbox"
    ).checked = d.eod;


    document.getElementById(
        "noPopCheckbox"
    ).checked = d.noPop;


    renderRN();

    renderPOP();

    updateProgress();

}


/* ========================================= */
/* RETAIL */
/* ========================================= */

function toggleRetail() {

    if (isPastDate(selectedDate)) {

        loadDailyTasks();

        return;

    }


    tasks[selectedDate].retailPending =
        document.getElementById(
            "retailCheckbox"
        ).checked;


    saveTasks();

    updateProgress();

    renderCalendar();

}


/* ========================================= */
/* EOD */
/* ========================================= */

function toggleEOD() {

    if (isPastDate(selectedDate)) {

        loadDailyTasks();

        return;

    }


    tasks[selectedDate].eod =
        document.getElementById(
            "eodCheckbox"
        ).checked;


    saveTasks();

    updateProgress();

    renderCalendar();

}


/* ========================================= */
/* NO POP */
/* ========================================= */

function toggleNoPOP() {

    if (isPastDate(selectedDate)) {

        loadDailyTasks();

        return;

    }


    let checkbox =
        document.getElementById(
            "noPopCheckbox"
        );


    tasks[selectedDate].noPop =
        checkbox.checked;


    if (checkbox.checked) {

        tasks[selectedDate].popValidation = [];

        document.getElementById(
            "popInput"
        ).value = "";

    }


    saveTasks();

    renderPOP();

    updateProgress();

    renderCalendar();

}


/* ========================================= */
/* RIGHTNOW */
/* ========================================= */

function addRN() {

    if (isPastDate(selectedDate)) {

        showNotification(
            "Past dates cannot be edited."
        );

        return;

    }


    let input =
        document.getElementById("rnInput");


    let value =
        input.value.trim();


    if (!/^\d{6}-\d{6}$/.test(value)) {

        showNotification(
            "NOT VALID RN — Use 6 digits-6 digits"
        );

        input.focus();

        return;

    }


    createDailyTasks(selectedDate);


    if (
        tasks[selectedDate].rightNow.some(
            x => x.number === value
        )
    ) {

        showNotification(
            "This RN is already added."
        );

        return;

    }


    tasks[selectedDate].rightNow.push({

        number: value,

        completed: false

    });


    saveTasks();

    input.value = "";

    renderRN();

    updateProgress();

    renderCalendar();

    showNotification(
        "RN added successfully."
    );

}


function renderRN() {

    let list =
        document.getElementById("rnList");


    list.innerHTML = "";


    let data =
        tasks[selectedDate].rightNow;


    if (!data.length) {

        list.innerHTML =
            '<div class="empty-number">No RN numbers added yet.</div>';

        document.getElementById(
            "rightnowProgress"
        ).textContent = "0%";

        return;

    }


    data.forEach((item, index) => {

        let row =
            document.createElement("div");

        row.className = "rn-item";


        let checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked =
            item.completed;


        checkbox.onchange = () => {

            if (isPastDate(selectedDate)) {

                checkbox.checked =
                    item.completed;

                return;

            }


            item.completed =
                checkbox.checked;


            saveTasks();

            renderRN();

            updateProgress();

            renderCalendar();

        };


        let text =
            document.createElement("span");

        text.className = "number-text";

        text.textContent =
            item.number;


        if (item.completed) {

            text.classList.add(
                "number-completed"
            );

        }


        let remove =
            document.createElement("button");

        remove.className =
            "remove-number";

        remove.textContent = "✕";

        remove.onclick =
            () => removeRN(index);


        row.append(
            checkbox,
            text,
            remove
        );


        list.appendChild(row);

    });


    document.getElementById(
        "rightnowProgress"
    ).textContent =
        calculateSectionProgress(
            selectedDate,
            "rightnow"
        ) + "%";

}


function removeRN(index) {

    if (isPastDate(selectedDate)) {

        showNotification(
            "Past dates cannot be edited."
        );

        return;

    }


    tasks[selectedDate].rightNow.splice(
        index,
        1
    );


    saveTasks();

    renderRN();

    updateProgress();

    renderCalendar();

}


/* ========================================= */
/* POP */
/* ========================================= */

function addPOP() {

    if (isPastDate(selectedDate)) {

        showNotification(
            "Past dates cannot be edited."
        );

        return;

    }


    let input =
        document.getElementById("popInput");


    let value =
        input.value.trim();


    if (!value) {

        showNotification(
            "Enter a POP number first."
        );

        return;

    }


    tasks[selectedDate].noPop = false;


    document.getElementById(
        "noPopCheckbox"
    ).checked = false;


    if (
        tasks[selectedDate].popValidation.some(
            x =>
                x.number.toLowerCase() ===
                value.toLowerCase()
        )
    ) {

        showNotification(
            "This POP is already added."
        );

        return;

    }


    tasks[selectedDate].popValidation.push({

        number: value,

        completed: false

    });


    saveTasks();

    input.value = "";

    renderPOP();

    updateProgress();

    renderCalendar();

    showNotification(
        "POP added successfully."
    );

}


function renderPOP() {

    let list =
        document.getElementById("popList");


    list.innerHTML = "";


    let data =
        tasks[selectedDate].popValidation;


    if (!data.length) {

        list.innerHTML =
            '<div class="empty-number">No POP numbers added yet.</div>';


        document.getElementById(
            "popProgress"
        ).textContent =
            tasks[selectedDate].noPop
                ? "100%"
                : "0%";

        return;

    }


    data.forEach((item, index) => {

        let row =
            document.createElement("div");

        row.className = "pop-item";


        let checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked =
            item.completed;


        checkbox.onchange = () => {

            if (isPastDate(selectedDate)) {

                checkbox.checked =
                    item.completed;

                return;

            }


            item.completed =
                checkbox.checked;


            saveTasks();

            renderPOP();

            updateProgress();

            renderCalendar();

        };


        let text =
            document.createElement("span");

        text.className =
            "number-text";

        text.textContent =
            item.number;


        if (item.completed) {

            text.classList.add(
                "number-completed"
            );

        }


        let remove =
            document.createElement("button");

        remove.className =
            "remove-number";

        remove.textContent = "✕";

        remove.onclick =
            () => removePOP(index);


        row.append(
            checkbox,
            text,
            remove
        );


        list.appendChild(row);

    });


    document.getElementById(
        "popProgress"
    ).textContent =
        calculateSectionProgress(
            selectedDate,
            "pop"
        ) + "%";

}


function removePOP(index) {

    if (isPastDate(selectedDate)) {

        showNotification(
            "Past dates cannot be edited."
        );

        return;

    }


    tasks[selectedDate].popValidation.splice(
        index,
        1
    );


    saveTasks();

    renderPOP();

    updateProgress();

    renderCalendar();

}


/* ========================================= */
/* PROGRESS */
/* ========================================= */

function updateProgress() {

    if (!selectedDate) {

        return;

    }


    let retail =
        calculateSectionProgress(
            selectedDate,
            "retail"
        );


    let rightNow =
        calculateSectionProgress(
            selectedDate,
            "rightnow"
        );


    let eod =
        calculateSectionProgress(
            selectedDate,
            "eod"
        );


    let pop =
        calculateSectionProgress(
            selectedDate,
            "pop"
        );


    document.getElementById(
        "retailProgress"
    ).textContent =
        retail + "%";


    document.getElementById(
        "rightnowProgress"
    ).textContent =
        rightNow + "%";


    document.getElementById(
        "eodProgress"
    ).textContent =
        eod + "%";


    document.getElementById(
        "popProgress"
    ).textContent =
        pop + "%";


    let overall =
        calculateProgress(selectedDate);


    document.getElementById(
        "overallPercent"
    ).textContent =
        overall + "%";


    document.getElementById(
        "progressFill"
    ).style.width =
        overall + "%";


    document.getElementById(
        "successMessage"
    ).style.display =
        overall === 100
            ? "block"
            : "none";

}


/* ========================================= */
/* STORAGE */
/* ========================================= */

function saveTasks() {

    localStorage.setItem(
        "myDailyTasks",
        JSON.stringify(tasks)
    );

}


function saveData() {

    saveTasks();

    showNotification(
        "Your tasks have been saved."
    );

}


function clearAll() {

    if (
        !confirm(
            "Are you sure you want to clear ALL tasks?"
        )
    ) {
        return;
    }


    tasks = {};

    saveTasks();

    renderCalendar();

    closeTasks();

    showNotification(
        "All tasks have been cleared."
    );

}


function deleteData() {

    if (!selectedDate) {

        showNotification(
            "Please select a date first."
        );

        return;

    }


    if (isPastDate(selectedDate)) {

        showNotification(
            "Past dates cannot be edited."
        );

        return;

    }


    if (
        !confirm(
            "Delete all tasks for this date?"
        )
    ) {
        return;
    }


    delete tasks[selectedDate];

    saveTasks();

    renderCalendar();

    closeTasks();

    showNotification(
        "Tasks for this date were deleted."
    );

}


/* ========================================= */
/* NOTIFICATION */
/* ========================================= */

function showNotification(message) {

    let n =
        document.getElementById(
            "notification"
        );


    n.textContent = message;

    n.classList.add("show");


    setTimeout(
        () => n.classList.remove("show"),
        2500
    );

}


/* ========================================= */
/* PAGE NAVIGATION */
/* ========================================= */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(
            p =>
                p.classList.remove("active")
        );


    document
        .getElementById(pageId)
        .classList.add("active");


    if (pageId === "templatePage") {

        renderTemplates();

    }


    if (pageId === "spielPage") {

        renderSpiels();

    }


    if (pageId === "documentationPage") {

        renderDocumentationHistory();

    }


    if (pageId === "informationPage") {

        renderInformation();

    }


    window.scrollTo(0, 0);

}


/* ========================================= */
/* INFORMATION */
/* ========================================= */

function openInformation() {

    showPage("informationPage");

    renderInformation();

}


/* ========================================= */
/* ADD EMAIL */
/* ========================================= */

function addInformationEmail() {

    let input =
        document.getElementById(
            "infoEmailInput"
        );


    let email =
        input.value.trim().toLowerCase();


    if (!email) {

        showNotification(
            "Please enter an email address."
        );

        input.focus();

        return;

    }


    let emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        showNotification(
            "Please enter a valid email address."
        );

        input.focus();

        return;

    }


    if (
        informationEmails.some(
            item =>
                item.email.toLowerCase() ===
                email
        )
    ) {

        showNotification(
            "This email is already added."
        );

        return;

    }


    informationEmails.push({
        email: email
    });


    localStorage.setItem(
        "informationEmails",
        JSON.stringify(
            informationEmails
        )
    );


    input.value = "";

    renderInformation();

    showNotification(
        "Email added successfully."
    );

}


/* ========================================= */
/* ADD PHONE */
/* ========================================= */

function addInformationPhone() {

    let labelInput =
        document.getElementById(
            "infoPhoneLabel"
        );


    let regionInput =
        document.getElementById(
            "infoPhoneRegion"
        );


    let phoneInput =
        document.getElementById(
            "infoPhoneInput"
        );


    let label =
        labelInput.value.trim();


    let region =
        regionInput.value;


    let phone =
        phoneInput.value.trim();


    if (!label) {

        showNotification(
            "Please enter a label for the number."
        );

        labelInput.focus();

        return;

    }


    if (!phone) {

        showNotification(
            "Please enter a phone number."
        );

        phoneInput.focus();

        return;

    }


    if (
        !/^[0-9+\s()\-]+$/.test(phone)
    ) {

        showNotification(
            "Invalid phone number."
        );

        phoneInput.focus();

        return;

    }


    if (
        informationPhones.some(
            item =>
                item.region === region &&
                item.phone === phone
        )
    ) {

        showNotification(
            "This phone number is already added."
        );

        return;

    }


    informationPhones.push({

        label: label,

        region: region,

        phone: phone

    });


    localStorage.setItem(
        "informationPhones",
        JSON.stringify(
            informationPhones
        )
    );


    labelInput.value = "";

    phoneInput.value = "";


    renderInformation();


    showNotification(
        "Phone number added successfully."
    );

}


/* ========================================= */
/* RENDER INFORMATION */
/* ========================================= */

function renderInformation() {

    let emailList =
        document.getElementById(
            "infoEmailList"
        );


    let phoneList =
        document.getElementById(
            "infoPhoneList"
        );


    if (!emailList || !phoneList) {

        return;

    }


    emailList.innerHTML = "";

    phoneList.innerHTML = "";


    /* EMAILS */

    if (!informationEmails.length) {

        emailList.innerHTML =
            '<div class="info-empty">No email information added.</div>';

    }

    else {

        informationEmails.forEach(
            (item, index) => {

                let row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "info-item";


                let value =
                    document.createElement(
                        "span"
                    );

                value.className =
                    "info-item-value";

                value.textContent =
                    item.email;


                let copy =
                    document.createElement(
                        "button"
                    );

                copy.className =
                    "info-action info-copy";

                copy.textContent = "COPY";

                copy.onclick = () =>
                    copyText(item.email);


                let edit =
                    document.createElement(
                        "button"
                    );

                edit.className =
                    "info-action info-edit";

                edit.textContent = "EDIT";

                edit.onclick = () =>
                    editInformationEmail(
                        index
                    );


                let del =
                    document.createElement(
                        "button"
                    );

                del.className =
                    "info-action info-delete";

                del.textContent = "DELETE";

                del.onclick = () =>
                    deleteInformationEmail(
                        index
                    );


                row.append(
                    value,
                    copy,
                    edit,
                    del
                );


                emailList.appendChild(row);

            }
        );

    }


    /* PHONE NUMBERS */

    if (!informationPhones.length) {

        phoneList.innerHTML =
            '<div class="info-empty">No technical support numbers added.</div>';

    }

    else {

        informationPhones.forEach(
            (item, index) => {

                let row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "info-item";


                let label =
                    document.createElement(
                        "span"
                    );

                label.className =
                    "info-item-label";

                label.textContent =
                    item.label;


                let region =
                    document.createElement(
                        "span"
                    );

                region.className =
                    "info-item-extension";

                region.textContent =
                    item.region;


                let value =
                    document.createElement(
                        "span"
                    );

                value.className =
                    "info-item-value";

                value.textContent =
                    item.phone;


                let copy =
                    document.createElement(
                        "button"
                    );

                copy.className =
                    "info-action info-copy";

                copy.textContent = "COPY";

                copy.onclick = () =>
                    copyText(item.phone);


                let edit =
                    document.createElement(
                        "button"
                    );

                edit.className =
                    "info-action info-edit";

                edit.textContent = "EDIT";

                edit.onclick = () =>
                    editInformationPhone(
                        index
                    );


                let del =
                    document.createElement(
                        "button"
                    );

                del.className =
                    "info-action info-delete";

                del.textContent = "DELETE";

                del.onclick = () =>
                    deleteInformationPhone(
                        index
                    );


                row.append(
                    label,
                    region,
                    value,
                    copy,
                    edit,
                    del
                );


                phoneList.appendChild(row);

            }
        );

    }

}


/* ========================================= */
/* EDIT EMAIL */
/* ========================================= */

function editInformationEmail(index) {

    let emailList =
        document.getElementById(
            "infoEmailList"
        );


    let row =
        emailList.children[index];


    if (!row) {

        return;

    }


    row.innerHTML = "";


    let input =
        document.createElement(
            "input"
        );

    input.type = "email";

    input.className =
        "info-edit-input";

    input.value =
        informationEmails[index].email;


    let save =
        document.createElement(
            "button"
        );

    save.className =
        "info-action info-save-edit";

    save.textContent = "SAVE";


    save.onclick = () => {

        saveInformationEmail(
            index,
            input.value
        );

    };


    let cancel =
        document.createElement(
            "button"
        );

    cancel.className =
        "info-action info-cancel-edit";

    cancel.textContent = "CANCEL";


    cancel.onclick = () => {

        renderInformation();

    };


    row.append(
        input,
        save,
        cancel
    );


    input.focus();

}


/* ========================================= */
/* SAVE EMAIL */
/* ========================================= */

function saveInformationEmail(
    index,
    value
) {

    value =
        value.trim().toLowerCase();


    if (!value) {

        showNotification(
            "Email cannot be empty."
        );

        return;

    }


    let emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(value)) {

        showNotification(
            "Please enter a valid email address."
        );

        return;

    }


    if (
        informationEmails.some(
            (item, i) =>
                i !== index &&
                item.email.toLowerCase() ===
                value
        )
    ) {

        showNotification(
            "This email is already added."
        );

        return;

    }


    informationEmails[index].email =
        value;


    localStorage.setItem(
        "informationEmails",
        JSON.stringify(
            informationEmails
        )
    );


    renderInformation();

    showNotification(
        "Email updated successfully."
    );

}


/* ========================================= */
/* DELETE EMAIL */
/* ========================================= */

function deleteInformationEmail(index) {

    if (
        !confirm(
            "Delete this email information?"
        )
    ) {
        return;
    }


    informationEmails.splice(
        index,
        1
    );


    localStorage.setItem(
        "informationEmails",
        JSON.stringify(
            informationEmails
        )
    );


    renderInformation();

    showNotification(
        "Email deleted."
    );

}


/* ========================================= */
/* EDIT PHONE */
/* ========================================= */

function editInformationPhone(index) {

    let phoneList =
        document.getElementById(
            "infoPhoneList"
        );


    let row =
        phoneList.children[index];


    if (!row) {

        return;

    }


    row.innerHTML = "";


    let labelInput =
        document.createElement(
            "input"
        );

    labelInput.type = "text";

    labelInput.className =
        "info-edit-input";

    labelInput.value =
        informationPhones[index].label;


    let regionInput =
        document.createElement(
            "select"
        );

    regionInput.className =
        "info-edit-select";


    regionInput.innerHTML = `
        <option value="AU">AU</option>
        <option value="NZ">NZ</option>
    `;


    regionInput.value =
        informationPhones[index].region;


    let phoneInput =
        document.createElement(
            "input"
        );

    phoneInput.type = "tel";

    phoneInput.className =
        "info-edit-input";

    phoneInput.value =
        informationPhones[index].phone;


    let save =
        document.createElement(
            "button"
        );

    save.className =
        "info-action info-save-edit";

    save.textContent = "SAVE";


    save.onclick = () => {

        saveInformationPhone(
            index,
            labelInput.value,
            regionInput.value,
            phoneInput.value
        );

    };


    let cancel =
        document.createElement(
            "button"
        );

    cancel.className =
        "info-action info-cancel-edit";

    cancel.textContent = "CANCEL";


    cancel.onclick = () => {

        renderInformation();

    };


    row.append(
        labelInput,
        regionInput,
        phoneInput,
        save,
        cancel
    );


    labelInput.focus();

}


/* ========================================= */
/* SAVE PHONE */
/* ========================================= */

function saveInformationPhone(
    index,
    label,
    region,
    phone
) {

    label = label.trim();

    phone = phone.trim();


    if (!label) {

        showNotification(
            "Label cannot be empty."
        );

        return;

    }


    if (!phone) {

        showNotification(
            "Phone number cannot be empty."
        );

        return;

    }


    if (
        !/^[0-9+\s()\-]+$/.test(phone)
    ) {

        showNotification(
            "Invalid phone number."
        );

        return;

    }


    if (
        informationPhones.some(
            (item, i) =>
                i !== index &&
                item.region === region &&
                item.phone === phone
        )
    ) {

        showNotification(
            "This phone number already exists."
        );

        return;

    }


    informationPhones[index] = {

        label: label,

        region: region,

        phone: phone

    };


    localStorage.setItem(
        "informationPhones",
        JSON.stringify(
            informationPhones
        )
    );


    renderInformation();

    showNotification(
        "Phone number updated successfully."
    );

}


/* ========================================= */
/* DELETE PHONE */
/* ========================================= */

function deleteInformationPhone(index) {

    if (
        !confirm(
            "Delete this phone number?"
        )
    ) {
        return;
    }


    informationPhones.splice(
        index,
        1
    );


    localStorage.setItem(
        "informationPhones",
        JSON.stringify(
            informationPhones
        )
    );


    renderInformation();

    showNotification(
        "Phone number deleted."
    );

}


/* ========================================= */
/* DEFAULT TEMPLATES */
/* ========================================= */

const defaultTemplates = [

    {
        title: "POP POF",

        text: `Good day!

We would like to follow up our request to have a copy of your Acer product’s invoice in reference to your Case ID: 93549D. Please make sure that the following details on your invoice is clear and readable:

• Store’s details (Store Name, address and contact number)
• Tax ID / ABN / GST (indicating that the document is intended as a Tax Invoice)
• Invoice Number
• Date of Purchase
• Purchase Unit’s Description and Price Details

In addition, we would also like to ask for all sides photos including the sticker at the bottom and picture of fault of your device.

You may send your e-mail to pop.aca@acer.com with the SNID/Serial Number or the Case Number as the subject of your mail.

Please be advised that we will close the case by 09 October 2026 if no response will be received.

Thank you and have a nice day!

NOTE: Please DO NOT REPLY to this email as this is not being monitored.

If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Kind regards,
Acer Customer Support Team`
    },

    {
        title: "POP POF / BATTERY REPORT",

        text: `Good day!

We would like to follow up our request to have a copy of your Acer product’s invoice in reference to your Case ID: 87750D.

We would also like to ask for all sides photos including the sticker at the bottom and picture of fault of your device.

In addition, we would like to request a Battery Report of your device for further investigation of the issue.

Steps to generate a battery report on Windows:

Press Windows + X on your keyboard and select Command Prompt (Admin) or Windows PowerShell (Admin).

In the Command Prompt or PowerShell window, type:

powercfg /batteryreport

The report will be saved in your user folder as battery-report.html.

You may send your e-mail to pop.aca@acer.com with the SNID/Serial Number or the Case Number as the subject of your mail.

Thank you and have a nice day!

Kind regards,
Acer Customer Support Team`
    },

    {
        title: "GENERAL INQUIRY TEMPLATE",

        text: `Hi Team,

Good day.

I hope this email finds you well.

Thank you for reaching out to Acer Customer Support. Your inquiry is important to us, and we are committed to providing you with the best assistance possible.

To streamline our communication process, I would like to inform you that the email address pop.aca@acer.com is designated solely for receiving invoices, photos, and videos requested by our Acer Customer Support Team.

For prompt and efficient assistance, please don't hesitate to contact us directly at 1300 365 100 (AU) / 0800 862 237 (NZ).

Thank you for your understanding and cooperation.

NOTE: Please DO NOT REPLY to this email as this is not being monitored.

Warm regards,
Acer Customer Support Team`
    },

    {
        title: "CLOSURE NOTIFICATION",

        text: `Good day!

Please be advised that it has been 5 business days since we last heard from you about your Acer Case Reference ID: 73313D. However, we have not received any response or update from you.

We will now close this case due to inactivity. Should you wish to proceed with the case, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Thank you and have a nice day!

NOTE: Please DO NOT REPLY to this email as this is not being monitored.

Kind regards,
Acer Customer Support Team`
    }

];


/* ========================================= */
/* DEFAULT SPIELS */
/* ========================================= */

const defaultSpiels = [

    {
        title: "GHOST SPIEL",

        text: `Hello [customer’s name]! I haven’t heard from you for a while are you still there?

---

Still there? It’s been a while since your last message. Do you want to continue chatting?

---

Hey there! You’ve been inactive for a while. Is there anything we can do to help you out?

---

Hi there? As it seems like you’re no longer responding, I’ll end this chat session. If you still need any help, feel free to request a new session. Thanks for reaching out to us.

Thank you for contacting Acer Chat Support! Have a good day!`
    },

    {
        title: "SURVEY SPIEL",

        text: `There’ll be a brief feedback survey sent to your email address after I close the chat. I’d really appreciate you taking the time to fill it out.

***

Thank you for contacting Acer Chat Support! Have a good day!`
    }

];


/* ========================================= */
/* TEMPLATE HELPERS */
/* ========================================= */

function getAllTemplates() {

    return [
        ...defaultTemplates,
        ...customTemplates
    ];

}


function getAllSpiels() {

    return [
        ...defaultSpiels,
        ...customSpiels
    ];

}


/* ========================================= */
/* COPY */
/* ========================================= */

function copyText(text) {

    navigator.clipboard.writeText(text)

        .then(
            () =>
                showNotification(
                    "Copied to clipboard."
                )
        )

        .catch(() => {

            let area =
                document.createElement(
                    "textarea"
                );

            area.value = text;

            document.body.appendChild(area);

            area.select();

            document.execCommand("copy");

            area.remove();

            showNotification(
                "Copied to clipboard."
            );

        });

}


/* ========================================= */
/* RENDER TEMPLATES */
/* ========================================= */

function renderTemplates() {

    let list =
        document.getElementById(
            "templateList"
        );


    list.innerHTML = "";


    getAllTemplates().forEach(
        (item, index) => {

            let card =
                document.createElement(
                    "div"
                );

            card.className = "card";


            let title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                item.title;


            let textarea =
                document.createElement(
                    "textarea"
                );

            textarea.className =
                "template-text";

            textarea.value =
                item.text;

            textarea.readOnly = true;


            let actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "template-actions";


            let copy =
                document.createElement(
                    "button"
                );

            copy.className =
                "action-btn copy-btn";

            copy.textContent = "COPY";

            copy.onclick =
                () => copyText(
                    textarea.value
                );


            let edit =
                document.createElement(
                    "button"
                );

            edit.className =
                "action-btn edit-btn";

            edit.textContent = "EDIT";


            let del =
                document.createElement(
                    "button"
                );

            del.className =
                "action-btn delete-template-btn";

            del.textContent = "DELETE";


            if (
                index < defaultTemplates.length
            ) {

                del.style.display = "none";

            }


            edit.onclick = () => {

                if (textarea.readOnly) {

                    textarea.readOnly = false;

                    edit.textContent =
                        "SAVE EDIT";

                    textarea.focus();

                }

                else {

                    if (
                        index <
                        defaultTemplates.length
                    ) {

                        defaultTemplates[index].text =
                            textarea.value;

                    }

                    else {

                        customTemplates[
                            index -
                            defaultTemplates.length
                        ].text =
                            textarea.value;


                        localStorage.setItem(
                            "customTemplates",
                            JSON.stringify(
                                customTemplates
                            )
                        );

                    }


                    textarea.readOnly = true;

                    edit.textContent = "EDIT";

                    showNotification(
                        "Template updated."
                    );

                }

            };


            del.onclick = () => {

                if (
                    !confirm(
                        "Delete this template?"
                    )
                ) {
                    return;
                }


                customTemplates.splice(
                    index -
                    defaultTemplates.length,
                    1
                );


                localStorage.setItem(
                    "customTemplates",
                    JSON.stringify(
                        customTemplates
                    )
                );


                renderTemplates();

            };


            actions.append(
                copy,
                edit,
                del
            );


            card.append(
                title,
                textarea,
                actions
            );


            list.appendChild(card);

        }
    );

}


/* ========================================= */
/* ADD TEMPLATE */
/* ========================================= */

function toggleAddTemplate() {

    let box =
        document.getElementById(
            "addTemplateBox"
        );


    box.style.display =
        box.style.display === "block"
            ? "none"
            : "block";

}


function addTemplate() {

    let title =
        document.getElementById(
            "newTemplateTitle"
        ).value.trim();


    let text =
        document.getElementById(
            "newTemplateText"
        ).value.trim();


    if (!title || !text) {

        showNotification(
            "Enter a title and template."
        );

        return;

    }


    customTemplates.push({
        title,
        text
    });


    localStorage.setItem(
        "customTemplates",
        JSON.stringify(
            customTemplates
        )
    );


    document.getElementById(
        "newTemplateTitle"
    ).value = "";


    document.getElementById(
        "newTemplateText"
    ).value = "";


    toggleAddTemplate();

    renderTemplates();


    showNotification(
        "Template added."
    );

}


/* ========================================= */
/* SPIELS */
/* ========================================= */

function renderSpiels() {

    let list =
        document.getElementById(
            "spielList"
        );


    list.innerHTML = "";


    getAllSpiels().forEach(
        (item, index) => {

            let card =
                document.createElement(
                    "div"
                );

            card.className = "card";


            let title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                item.title;


            let textarea =
                document.createElement(
                    "textarea"
                );

            textarea.className =
                "spiel-text";

            textarea.value =
                item.text;

            textarea.readOnly = true;


            let actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "spiel-actions";


            let copy =
                document.createElement(
                    "button"
                );

            copy.className =
                "action-btn copy-btn";

            copy.textContent = "COPY";

            copy.onclick =
                () => copyText(
                    textarea.value
                );


            let edit =
                document.createElement(
                    "button"
                );

            edit.className =
                "action-btn edit-btn";

            edit.textContent = "EDIT";


            let del =
                document.createElement(
                    "button"
                );

            del.className =
                "action-btn delete-template-btn";

            del.textContent = "DELETE";


            edit.onclick = () => {

                if (textarea.readOnly) {

                    textarea.readOnly = false;

                    edit.textContent =
                        "SAVE EDIT";

                    textarea.focus();

                }

                else {

                    if (
                        index <
                        defaultSpiels.length
                    ) {

                        defaultSpiels[index].text =
                            textarea.value;

                    }

                    else {

                        customSpiels[
                            index -
                            defaultSpiels.length
                        ].text =
                            textarea.value;


                        localStorage.setItem(
                            "customSpiels",
                            JSON.stringify(
                                customSpiels
                            )
                        );

                    }


                    textarea.readOnly = true;

                    edit.textContent = "EDIT";

                    showNotification(
                        "Spiel updated."
                    );

                }

            };


            if (
                index <
                defaultSpiels.length
            ) {

                del.style.display = "none";

            }


            del.onclick = () => {

                if (
                    !confirm(
                        "Delete this spiel?"
                    )
                ) {
                    return;
                }


                customSpiels.splice(
                    index -
                    defaultSpiels.length,
                    1
                );


                localStorage.setItem(
                    "customSpiels",
                    JSON.stringify(
                        customSpiels
                    )
                );


                renderSpiels();

            };


            actions.append(
                copy,
                edit,
                del
            );


            card.append(
                title,
                textarea,
                actions
            );


            list.appendChild(card);

        }
    );

}


function toggleAddSpiel() {

    let box =
        document.getElementById(
            "addSpielBox"
        );


    box.style.display =
        box.style.display === "block"
            ? "none"
            : "block";

}


function addSpiel() {

    let title =
        document.getElementById(
            "newSpielTitle"
        ).value.trim();


    let text =
        document.getElementById(
            "newSpielText"
        ).value.trim();


    if (!title || !text) {

        showNotification(
            "Enter a title and spiel."
        );

        return;

    }


    customSpiels.push({
        title,
        text
    });


    localStorage.setItem(
        "customSpiels",
        JSON.stringify(
            customSpiels
        )
    );


    document.getElementById(
        "newSpielTitle"
    ).value = "";


    document.getElementById(
        "newSpielText"
    ).value = "";


    toggleAddSpiel();

    renderSpiels();


    showNotification(
        "Spiel added."
    );

}


/* ========================================= */
/* DOCUMENTATION */
/* ========================================= */

function openDocumentation() {

    showPage("documentationPage");


    document.getElementById(
        "docName"
    ).value = "";


    document.getElementById(
        "docContact"
    ).value = "";


    document.getElementById(
        "docEmail"
    ).value = "";


    document.getElementById(
        "docConcern"
    ).value = "";


    document.getElementById(
        "docResolution"
    ).value = "";


    document.getElementById(
        "documentationPreview"
    ).textContent =
        "No documentation created yet.";

}


function confirmDocumentation() {

    let name =
        document.getElementById(
            "docName"
        ).value.trim();


    let contact =
        document.getElementById(
            "docContact"
        ).value.trim();


    let email =
        document.getElementById(
            "docEmail"
        ).value.trim();


    let concern =
        document.getElementById(
            "docConcern"
        ).value.trim();


    let resolution =
        document.getElementById(
            "docResolution"
        ).value.trim();


    if (
        !name ||
        !contact ||
        !email ||
        !concern ||
        !resolution
    ) {

        showNotification(
            "Please complete all fields."
        );

        return;

    }


    let now = new Date();


    let record = {

        name,

        contact,

        email,

        concern,

        resolution,

        survey: "Yes",

        date: now.toLocaleString()

    };


    documentationData.push(record);


    localStorage.setItem(
        "documentationData",
        JSON.stringify(
            documentationData
        )
    );


    let text =
`Name : ${name}
Contact: ${contact}
Email : ${email}
****
Cx concern*
${concern}
Resolution provided : ${resolution}
****
Survey sent?  Yes`;


    document.getElementById(
        "documentationPreview"
    ).textContent = text;


    document.getElementById(
        "docName"
    ).value = "";


    document.getElementById(
        "docContact"
    ).value = "";


    document.getElementById(
        "docEmail"
    ).value = "";


    document.getElementById(
        "docConcern"
    ).value = "";


    document.getElementById(
        "docResolution"
    ).value = "";


    renderDocumentationHistory();


    showNotification(
        "Documentation created successfully."
    );

}


/* ========================================= */
/* DOCUMENTATION HISTORY */
/* ========================================= */

function renderDocumentationHistory() {

    let history =
        document.getElementById(
            "documentationHistory"
        );


    if (!history) {

        return;

    }


    history.innerHTML = "";


    if (!documentationData.length) {

        history.innerHTML =
            '<div class="empty-number">No documentation history yet.</div>';

        return;

    }


    documentationData
        .slice()
        .reverse()
        .forEach(
            (item, reverseIndex) => {

                let originalIndex =
                    documentationData.length -
                    1 -
                    reverseIndex;


                let box =
                    document.createElement(
                        "div"
                    );

                box.className =
                    "history-item";


                let date =
                    document.createElement(
                        "div"
                    );

                date.className =
                    "history-date";

                date.textContent =
                    "Created: " +
                    item.date;


                let content =
                    document.createElement(
                        "div"
                    );

                content.className =
                    "doc-result";


                content.textContent =
`Name : ${item.name}
Contact: ${item.contact}
Email : ${item.email}
****
Cx concern*
${item.concern}
Resolution provided : ${item.resolution}
****
Survey sent?  Yes`;


                let actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "history-actions";


                let copy =
                    document.createElement(
                        "button"
                    );

                copy.className =
                    "action-btn copy-btn";

                copy.textContent = "COPY";

                copy.onclick =
                    () =>
                        copyText(
                            content.textContent
                        );


                let del =
                    document.createElement(
                        "button"
                    );

                del.className =
                    "action-btn delete-template-btn";

                del.textContent = "DELETE";


                del.onclick = () => {

                    if (
                        !confirm(
                            "Delete this documentation history?"
                        )
                    ) {
                        return;
                    }


                    documentationData.splice(
                        originalIndex,
                        1
                    );


                    localStorage.setItem(
                        "documentationData",
                        JSON.stringify(
                            documentationData
                        )
                    );


                    renderDocumentationHistory();

                };


                actions.append(
                    copy,
                    del
                );


                box.append(
                    date,
                    content,
                    actions
                );


                history.appendChild(box);

            }
        );

}


/* ========================================= */
/* EXPORT */
/* ========================================= */

async function exportAllDocumentation() {

    const dates =
        Object.keys(tasks)
            .filter(key => {

                return tasks[key] &&
                (
                    (
                        tasks[key].rightNow &&
                        tasks[key].rightNow.length > 0
                    ) ||
                    (
                        tasks[key].popValidation &&
                        tasks[key].popValidation.length > 0
                    )
                );

            })
            .sort();


    const docs =
        documentationData;


    /* ========================================= */
    /* RN CREATION DATA */
/* ========================================= */

    const rnCreationHistory =
        JSON.parse(
            localStorage.getItem(
                "rnCreationHistory"
            ) || "[]"
        );


    if (
        dates.length === 0 &&
        docs.length === 0 &&
        rnCreationHistory.length === 0
    ) {

        alert(
            "There are no RightNow, POP Validation, Documentation, or RN Creation logs to export yet."
        );

        return;

    }


    if (!window.showDirectoryPicker) {

        alert(
            "Your browser/compiler does not support automatic folder creation.\n\n" +
            "Please use a recent version of Chrome or Edge."
        );

        return;

    }


    try {

        const documentsHandle =
            await window.showDirectoryPicker({

                mode: "readwrite",

                startIn: "documents"

            });


        let permission =
            await documentsHandle.queryPermission({
                mode: "readwrite"
            });


        if (permission !== "granted") {

            permission =
                await documentsHandle.requestPermission({
                    mode: "readwrite"
                });

        }


        if (permission !== "granted") {

            throw new Error(
                "Folder permission was not granted."
            );

        }


        const monthHandles = {};

        let filesCreated = 0;

        let rnFilesCreated = 0;


        function getMonthFolder(key) {

            const parts =
                key.split("-");


            if (parts.length !== 3) {

                return null;

            }


            const year =
                parts[0];


            const monthNumber =
                Number(parts[1]);


            const monthName =
                new Date(
                    Number(year),
                    monthNumber - 1,
                    1
                ).toLocaleDateString(
                    "en-US",
                    {
                        month: "short"
                    }
                );


            const displayMonth =
                monthName === "Sep"
                    ? "Sept"
                    : monthName;


            return (
                `${displayMonth} ${year}`
            );

        }


        /* ========================================= */
        /* CHAT ESSENTIALS DAILY TASK EXPORT */
        /* ========================================= */

        for (const key of dates) {

            const folderName =
                getMonthFolder(key);


            if (!folderName) {

                continue;

            }


            if (!monthHandles[folderName]) {

                monthHandles[folderName] =
                    await documentsHandle.getDirectoryHandle(
                        folderName,
                        {
                            create: true
                        }
                    );

            }


            const day =
                tasks[key];


            let content = "";


            content +=
                "CHAT ESSENTIALS DAILY TASK EXPORT\n";


            content +=
                "====================================\n\n";


            content +=
                `DATE: ${key}\n\n`;


            content +=
                "RIGHTNOW\n";


            content +=
                "------------------------------------\n";


            if (
                day.rightNow &&
                day.rightNow.length
            ) {

                day.rightNow.forEach(
                    (rn, index) => {

                        content +=
                            `${index + 1}. ${rn.number} - ` +
                            `${rn.completed ? "DONE" : "PENDING"}\n`;

                    }
                );

            }

            else {

                content +=
                    "No RN numbers added.\n";

            }


            content +=
                "\nPOP VALIDATION\n";


            content +=
                "------------------------------------\n";


            if (day.noPop) {

                content +=
                    "NO POP ASSIGNED - DONE\n";

            }

            else if (
                day.popValidation &&
                day.popValidation.length
            ) {

                day.popValidation.forEach(
                    (pop, index) => {

                        content +=
                            `${index + 1}. ${pop.number} - ` +
                            `${pop.completed ? "DONE" : "PENDING"}\n`;

                    }
                );

            }

            else {

                content +=
                    "No POP validation added.\n";

            }


            content +=
                `\nDAILY PROGRESS: ${calculateProgress(key)}%\n`;


            const filename =
                `Chat_Essentials_${key}.txt`;


            const fileHandle =
                await monthHandles[
                    folderName
                ].getFileHandle(
                    filename,
                    {
                        create: true
                    }
                );


            const writable =
                await fileHandle.createWritable();


            await writable.write(content);

            await writable.close();


            filesCreated++;

        }


        /* ========================================= */
        /* DOCUMENTATION EXPORT */
        /* ========================================= */

        if (docs.length) {

            for (const call of docs) {

                let dateObj =
                    new Date(call.date);


                let year =
                    dateObj.getFullYear();


                let monthNumber =
                    dateObj.getMonth() + 1;


                let monthName =
                    new Date(
                        year,
                        monthNumber - 1,
                        1
                    ).toLocaleDateString(
                        "en-US",
                        {
                            month: "short"
                        }
                    );


                let displayMonth =
                    monthName === "Sep"
                        ? "Sept"
                        : monthName;


                let folderName =
                    `${displayMonth} ${year}`;


                if (!monthHandles[folderName]) {

                    monthHandles[folderName] =
                        await documentsHandle.getDirectoryHandle(
                            folderName,
                            {
                                create: true
                            }
                        );

                }


                let key =
                    formatDate(dateObj);


                let content = "";


                content +=
                    "CALL DOCUMENTATION\n";


                content +=
                    "============================\n\n";


                content +=
                    `Documentation Date: ${key}\n\n`;


                content +=
                    "----------------------------\n";


                content +=
                    `NAME: ${call.name || "N/A"}\n`;


                content +=
                    `CONTACT: ${call.contact || "N/A"}\n`;


                content +=
                    `EMAIL: ${call.email || "N/A"}\n`;


                content +=
                    "CONCERN:\n";


                content +=
                    `${call.concern || "N/A"}\n\n`;


                content +=
                    "RESOLUTION PROVIDED:\n";


                content +=
                    `${call.resolution || "N/A"}\n\n`;


                content +=
                    "SURVEY SENT? Yes\n";


                let filename =
                    `Documentation_${key}_${String(
                        dateObj.getTime()
                    ).slice(-6)}.txt`;


                let fileHandle =
                    await monthHandles[
                        folderName
                    ].getFileHandle(
                        filename,
                        {
                            create: true
                        }
                    );


                let writable =
                    await fileHandle.createWritable();


                await writable.write(content);

                await writable.close();


                filesCreated++;

            }

        }


        /* ========================================= */
        /* RN CREATION TXT EXPORT */
        /* ========================================= */

        if (rnCreationHistory.length) {

            for (const record of rnCreationHistory) {

                let dateObj =
                    new Date();


                /*
                 * RN Creation saves the date as:
                 * DD/MM/YYYY, HH:MM AM/PM
                 */

                if (record.date) {

                    const match =
                        record.date.match(
                            /^(\d{2})\/(\d{2})\/(\d{4})/
                        );


                    if (match) {

                        dateObj =
                            new Date(
                                Number(match[3]),
                                Number(match[2]) - 1,
                                Number(match[1])
                            );

                    }

                }


                let year =
                    dateObj.getFullYear();


                let monthNumber =
                    dateObj.getMonth() + 1;


                let monthName =
                    dateObj.toLocaleDateString(
                        "en-US",
                        {
                            month: "short"
                        }
                    );


                let displayMonth =
                    monthName === "Sep"
                        ? "Sept"
                        : monthName;


                let folderName =
                    `${displayMonth} ${year}`;


                if (!monthHandles[folderName]) {

                    monthHandles[folderName] =
                        await documentsHandle.getDirectoryHandle(
                            folderName,
                            {
                                create: true
                            }
                        );

                }


                /* ========================================= */
                /* RN CREATION CONTENT */
                /* ========================================= */

                let content = "";


                content +=
                    "RN CREATION\n";


                content +=
                    "============================\n\n";


                content +=
                    `Created: ${record.date || "N/A"}\n\n`;


                content +=
                    "SNID/SN\n";


                content +=
                    "----------------------------\n";


                content +=
                    `${record.snidSn || "N/A"}\n\n`;


                content +=
                    "CUSTOMER EMAIL\n";


                content +=
                    "----------------------------\n";


                content +=
                    `${record.customerEmail || "N/A"}\n\n`;


                content +=
                    "RN NUMBER\n";


                content +=
                    "----------------------------\n";


                content +=
                    `${record.rnNumber || "N/A"}\n\n`;


                content +=
                    "CUSTOMER NAME\n";


                content +=
                    "----------------------------\n";


                content +=
                    `${record.customerName || "N/A"}\n\n`;


                content +=
                    "CUSTOMER EMAIL / MESSAGE\n";


                content +=
                    "----------------------------\n";


                content +=
                    `${record.customerMessage || "N/A"}\n\n`;


                content +=
                    "MY REPLY TO CUSTOMER\n";


                content +=
                    "----------------------------\n";


                content +=
                    `${record.myReply || "N/A"}\n\n`;


                content +=
                    "============================\n";


                content +=
                    "END OF RN CREATION RECORD\n";


                /* ========================================= */
                /* SAFE FILE NAME */
                /* ========================================= */

                const safeRN =
                    (
                        record.rnNumber ||
                        "No_RN"
                    ).replace(
                        /[^a-zA-Z0-9\-]/g,
                        "_"
                    );


                const filename =
                    `RN_Creation_${safeRN}_${record.id || Date.now()}.txt`;


                const fileHandle =
                    await monthHandles[
                        folderName
                    ].getFileHandle(
                        filename,
                        {
                            create: true
                        }
                    );


                const writable =
                    await fileHandle.createWritable();


                await writable.write(
                    content
                );


                await writable.close();


                filesCreated++;

                rnFilesCreated++;

            }

        }


        /* ========================================= */
        /* EXPORT COMPLETE */
        /* ========================================= */

        alert(
            `Export completed successfully!\n\n` +
            `📁 Location: Documents\n` +
            `📂 Month folders created/updated: ${Object.keys(monthHandles).length}\n` +
            `📄 TXT files exported: ${filesCreated}\n` +
            `📝 RN Creation records exported: ${rnFilesCreated}`
        );

    }

    catch (error) {

        if (
            error &&
            error.name === "AbortError"
        ) {

            return;

        }


        console.error(error);


        alert(
            "The data could not be exported.\n\n" +
            "Make sure you selected the Windows Documents folder and allowed file access."
        );

    }

}


/* ========================================= */
/* DAILY BIBLE VERSE */
/* ========================================= */

function setDailyBibleVerse() {

    let now = new Date();


    let start =
        new Date(
            now.getFullYear(),
            0,
            0
        );


    let day =
        Math.floor(
            (now - start) /
            86400000
        );


    let verse =
        bibleVerses[
            (day - 1) %
            bibleVerses.length
        ];


    document.getElementById(
        "bibleVerse"
    ).innerHTML =
        `"${verse[0]}"<br><strong>— ${verse[1]}</strong>`;

}


/* ========================================= */
/* ENTER KEY SUPPORT */
/* ========================================= */

document
    .getElementById("rnInput")
    .addEventListener(
        "keydown",
        e => {

            if (e.key === "Enter") {

                addRN();

            }

        }
    );


document
    .getElementById("popInput")
    .addEventListener(
        "keydown",
        e => {

            if (e.key === "Enter") {

                addPOP();

            }

        }
    );


document
    .getElementById("infoEmailInput")
    .addEventListener(
        "keydown",
        e => {

            if (e.key === "Enter") {

                addInformationEmail();

            }

        }
    );


document
    .getElementById("infoPhoneInput")
    .addEventListener(
        "keydown",
        e => {

            if (e.key === "Enter") {

                addInformationPhone();

            }

        }
    );


document
    .getElementById("infoPhoneLabel")
    .addEventListener(
        "keydown",
        e => {

            if (e.key === "Enter") {

                addInformationPhone();

            }

        }
    );


/* ========================================= */
/* OVERLAY */
/* ========================================= */

document
    .getElementById("overlay")
    .addEventListener(
        "click",
        closeTasks
    );


/* ========================================= */
/* INITIALIZE */
/* ========================================= */

setDailyBibleVerse();

renderCalendar();

renderInformation();