let validationType = null;
let caseId = "";
let overallValidation = null;
let proofSubmissionChoice = null;

// Remember each type's proof answer and missing-proof template until Finish Case is clicked.
const proofSubmissionChoiceByType = { POF: null, VOF: null, POP: null };
const replyOnlyTemplateByType = { POF: null, VOF: null, POP: null };

// Keeps each validation result when switching between POF, VOF and POP.
const validationResults = {
    POF: null,
    VOF: null,
    POP: null
};

const completedPDFByType = { POF: false, VOF: false, POP: false };

let popPhotos = [];
let currentPhotoIndex = 0;

let vofVideoFile = null;
let vofVideoURL = null;
let includedFrames = [];

let popFile = null;
let popFileURL = null;
let snid = "";

let pofInvalidReasons = [];
let vofInvalidReasons = [];
let popInvalidReasons = [];

const CASE_ID_REGEX = /^\d{6}D$/;
const SNID_REGEX = /^\d{11}$/;

const MAX_PDF_SIZE = 4 * 1024 * 1024;

const qualitySteps = [
    { maxDimension: 2800, quality: 0.92 },
    { maxDimension: 2600, quality: 0.90 },
    { maxDimension: 2400, quality: 0.88 },
    { maxDimension: 2200, quality: 0.86 },
    { maxDimension: 2100, quality: 0.84 },
    { maxDimension: 2000, quality: 0.82 },
    { maxDimension: 1800, quality: 0.80 },
    { maxDimension: 1600, quality: 0.78 },
    { maxDimension: 1400, quality: 0.76 },
    { maxDimension: 1200, quality: 0.74 },
    { maxDimension: 1000, quality: 0.70 }
];

/* =========================================================
   CASE ID
   ========================================================= */

document.getElementById("caseIdInput").addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^0-9D]/g, "");

    const valid = CASE_ID_REGEX.test(this.value);

    document.getElementById("caseIdError").style.display =
        this.value.length && !valid ? "block" : "none";

    document.getElementById("validationTypeSection").style.display =
        valid ? "block" : "none";

    if (valid) {
        caseId = this.value;
        ["POP", "POF", "VOF"].forEach(type => updateAdditionalReplyTemplate(type));
    } else {
        caseId = "";
        resetValidationType();
        ["POP", "POF", "VOF"].forEach(type => updateAdditionalReplyTemplate(type));
    }
});

/* =========================================================
   VALIDATION TYPE
   ========================================================= */

function selectValidationType(type) {
    if (!['POF', 'VOF', 'POP'].includes(type)) return;

    // Preserve the previous validation result when moving between types.
    if (validationType && ['POF', 'VOF', 'POP'].includes(validationType)) {
        validationResults[validationType] = overallValidation;
    }

    validationType = type;
    proofSubmissionChoice = proofSubmissionChoiceByType[type];
    overallValidation = validationResults[type];

    closePOFInvalidModal();
    closeVOFInvalidModal();
    closePOPInvalidModal();

    document.querySelectorAll('.type-button').forEach(button => button.classList.remove('selected'));
    const selectedButton = type === 'POF' ? 'pofTypeButton' : type === 'VOF' ? 'vofTypeButton' : 'popTypeButton';
    const selectedElement = document.getElementById(selectedButton);
    if (selectedElement) selectedElement.classList.add('selected');

    ['pofUploadSection', 'vofUploadSection', 'popSection', 'validationResult', 'generateSection'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    ['POF', 'VOF', 'POP'].forEach(hideAdditionalReplyTemplate);
    ['pofReplySection', 'vofReplySection', 'popReplySection'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    const questionPanel = document.getElementById('proofSubmissionQuestion');

    // If this type has already been handled, restore its previous state instead of
    // asking the proof question again or forcing the user to regenerate the reply.
    if (proofSubmissionChoiceByType[type] === 'no') {
        if (questionPanel) questionPanel.style.display = 'none';
        const defaultTemplate = type === 'POP' ? 'no-pop' : 'no-pof';
        showAdditionalReplyTemplate(type, replyOnlyTemplateByType[type] || defaultTemplate);
        return;
    }

    if (proofSubmissionChoiceByType[type] === 'yes') {
        if (questionPanel) questionPanel.style.display = 'none';
        if (type === 'POF') document.getElementById('pofUploadSection').style.display = 'block';
        if (type === 'VOF') document.getElementById('vofUploadSection').style.display = 'block';
        if (type === 'POP') document.getElementById('popSection').style.display = 'block';

        showValidationResult();
        document.getElementById('generateSection').style.display = validationResults[type] !== null ? 'block' : 'none';

        const replyConfig = {
            POF: ['pofReplySection', 'pofReplyTemplate'],
            VOF: ['vofReplySection', 'vofReplyTemplate'],
            POP: ['popReplySection', 'popReplyTemplate']
        }[type];
        const replySection = document.getElementById(replyConfig[0]);
        const replyField = document.getElementById(replyConfig[1]);
        if (replySection && replyField && replyField.value.trim()) {
            replySection.style.display = 'block';
        }
        updateDoneButtonVisibility();
        return;
    }

    // First time selecting this validation type: ask whether proof was submitted.
    if (questionPanel) {
        const proofName = type === 'POP' ? 'Proof of Purchase (POP)' : type === 'POF' ? 'Proof of Fault (POF)' : 'Video of Fault (VOF)';
        const question = document.getElementById('proofSubmissionQuestionText');
        if (question) question.textContent = `Did the customer / retailer submit the ${proofName}?`;
        questionPanel.style.display = 'block';
    }
    updateDoneButtonVisibility();
}

function handleProofSubmission(answer) {
    if (!['POF', 'VOF', 'POP'].includes(validationType)) return;
    proofSubmissionChoice = answer;
    proofSubmissionChoiceByType[validationType] = answer;

    const questionPanel = document.getElementById('proofSubmissionQuestion');
    if (questionPanel) questionPanel.style.display = 'none';

    ['pofUploadSection', 'vofUploadSection', 'popSection', 'validationResult', 'generateSection'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    ['POF', 'VOF', 'POP'].forEach(hideAdditionalReplyTemplate);

    if (answer === 'no') {
        const templateKey = validationType === 'POP' ? 'no-pop' : 'no-pof';
        replyOnlyTemplateByType[validationType] = templateKey;
        showAdditionalReplyTemplate(validationType, templateKey);
        return;
    }

    // YES: continue into the original validation flow and keep this answer cached.
    replyOnlyTemplateByType[validationType] = null;
    if (validationType === 'POF') document.getElementById('pofUploadSection').style.display = 'block';
    if (validationType === 'VOF') document.getElementById('vofUploadSection').style.display = 'block';
    if (validationType === 'POP') {
        document.getElementById('popSection').style.display = 'block';
        validateSNIDField();
    }

    showValidationResult();
    const hasValidation = validationResults[validationType] !== null;
    document.getElementById('generateSection').style.display = hasValidation ? 'block' : 'none';
    updateDoneButtonVisibility();
}

function showAdditionalInfoTemplate() {
    // Additional Info is a reply-only workflow; it does not enter POP/POF/VOF validation.
    validationType = null;
    proofSubmissionChoice = null;
    overallValidation = null;
    closePOFInvalidModal();
    closeVOFInvalidModal();
    closePOPInvalidModal();

    document.querySelectorAll('.type-button').forEach(button => button.classList.remove('selected'));
    ['pofUploadSection', 'vofUploadSection', 'popSection', 'validationResult', 'generateSection', 'proofSubmissionQuestion', 'pofReplySection', 'vofReplySection', 'popReplySection'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    ['POF', 'VOF', 'POP'].forEach(hideAdditionalReplyTemplate);
    showAdditionalReplyTemplate('POP', 'additional-info');
    updateDoneButtonVisibility();
}

function resetValidationType() {
    validationType = null;
    overallValidation = null;
    validationResults.POF = null;
    validationResults.VOF = null;
    validationResults.POP = null;
    completedPDFByType.POF = false;
    completedPDFByType.VOF = false;
    completedPDFByType.POP = false;
    updateDoneButtonVisibility();
    proofSubmissionChoice = null;
    Object.keys(proofSubmissionChoiceByType).forEach(type => { proofSubmissionChoiceByType[type] = null; });
    Object.keys(replyOnlyTemplateByType).forEach(type => { replyOnlyTemplateByType[type] = null; });
    const proofQuestion = document.getElementById("proofSubmissionQuestion");
    if (proofQuestion) proofQuestion.style.display = "none";
    ["POP", "POF", "VOF"].forEach(hideAdditionalReplyTemplate);

    pofInvalidReasons = [];
    vofInvalidReasons = [];
    popInvalidReasons = [];

    hidePOFReply();
    hideVOFReply();
    hidePOPReply();

    closePOFInvalidModal();
    closeVOFInvalidModal();
    closePOPInvalidModal();

    [
        "pofUploadSection",
        "vofUploadSection",
        "popSection",
        "validationResult",
        "generateSection"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = "none";
    });
}

/* =========================================================
   DROP ZONE
   ========================================================= */

function setupDropZone(zoneId, inputId, handler, multiple = false) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);

    if (!zone || !input) return;

    ["dragenter", "dragover"].forEach(eventName => {
        zone.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
            zone.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        zone.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
            zone.classList.remove("drag-over");
        });
    });

    zone.addEventListener("drop", event => {
        const files = Array.from(event.dataTransfer.files || []);
        if (!files.length) return;

        handler(multiple ? files : [files[0]]);
    });

    zone.addEventListener("click", event => {
        if (event.target.closest("button")) return;
        input.click();
    });
}

/* =========================================================
   POF UPLOAD
   ========================================================= */

function processPOFFiles(files) {
    const validFiles = files.filter(file =>
        ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
    );

    if (!validFiles.length) {
        alert("Only JPEG, JPG or PNG photos are allowed.");
        return;
    }

    popPhotos = [...popPhotos, ...validFiles];
    currentPhotoIndex = popPhotos.length - validFiles.length;
    overallValidation = null;
    if (validationType) validationResults[validationType] = null;
    pofInvalidReasons = [];

    hidePOFReply();

    showCurrentPhoto();

    document.getElementById("photoViewer").style.display = "flex";
    document.getElementById("photoNavigation").style.display = "flex";
    document.getElementById("pofStatus").style.display = "block";

    renderPOFThumbnails();

    document.getElementById("generateSection").style.display = "none";

    showValidationResult();
}

document.getElementById("pofPhotoInput").addEventListener("change", event => {
    processPOFFiles(Array.from(event.target.files));
    event.target.value = "";
});

setupDropZone("pofDropZone", "pofPhotoInput", processPOFFiles, true);

/* =========================================================
   POF CURRENT PHOTO
   ========================================================= */

function showCurrentPhoto() {
    if (!popPhotos.length) {
        document.getElementById("photoViewer").style.display = "none";
        document.getElementById("photoNavigation").style.display = "none";
        document.getElementById("pofThumbnails").style.display = "none";
        document.getElementById("pofStatus").style.display = "none";
        document.getElementById("validationResult").style.display = "none";
        document.getElementById("generateSection").style.display = "none";
        return;
    }

    currentPhotoIndex = Math.max(
        0,
        Math.min(currentPhotoIndex, popPhotos.length - 1)
    );

    const reader = new FileReader();

    reader.onload = event => {
        document.getElementById("currentPhoto").src = event.target.result;
    };

    reader.readAsDataURL(popPhotos[currentPhotoIndex]);

    document.getElementById("photoCounter").textContent =
        `${currentPhotoIndex + 1} / ${popPhotos.length}`;

    document.getElementById("pofStatus").textContent =
        `${popPhotos.length} photo(s) attached. Review each photo before selecting VALID or INVALID.`;

    renderPOFThumbnails();
}

/* =========================================================
   POF THUMBNAILS
   ========================================================= */

function renderPOFThumbnails() {
    const container = document.getElementById("pofThumbnails");

    if (!popPhotos.length) {
        container.innerHTML = "";
        container.style.display = "none";
        return;
    }

    container.style.display = "grid";
    container.innerHTML = "";

    popPhotos.forEach((file, index) => {
        const card = document.createElement("div");
        card.className = "pof-thumbnail";

        if (index === currentPhotoIndex) {
            card.classList.add("selected");
        }

        const image = document.createElement("img");
        const reader = new FileReader();

        reader.onload = event => {
            image.src = event.target.result;
        };

        reader.readAsDataURL(file);

        image.onclick = () => {
            currentPhotoIndex = index;
            overallValidation = null;
    if (validationType) validationResults[validationType] = null;

            hidePOFReply();

            document.getElementById("generateSection").style.display = "none";

            showCurrentPhoto();
        };

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "pof-thumbnail-remove";
        removeButton.textContent = "×";
        removeButton.title = "Remove this photo";

        removeButton.onclick = event => {
            event.stopPropagation();
            removePOFPhoto(index);
        };

        const number = document.createElement("div");
        number.className = "pof-thumbnail-number";
        number.textContent = `Photo ${index + 1}`;

        card.append(image, removeButton, number);
        container.appendChild(card);
    });
}

function removeCurrentPhoto() {
    if (popPhotos.length) {
        removePOFPhoto(currentPhotoIndex);
    }
}

function removePOFPhoto(index) {
    if (index < 0 || index >= popPhotos.length) return;

    const file = popPhotos[index];

    if (!confirm(`Remove this photo?\n\n${file.name}`)) return;

    popPhotos.splice(index, 1);
    overallValidation = null;
    if (validationType) validationResults[validationType] = null;
    pofInvalidReasons = [];

    hidePOFReply();

    document.getElementById("generateSection").style.display = "none";

    if (currentPhotoIndex > index) currentPhotoIndex--;

    if (currentPhotoIndex >= popPhotos.length) {
        currentPhotoIndex = popPhotos.length - 1;
    }

    if (!popPhotos.length) {
        document.getElementById("currentPhoto").src = "";
        document.getElementById("photoViewer").style.display = "none";
        document.getElementById("photoNavigation").style.display = "none";
        document.getElementById("pofThumbnails").style.display = "none";
        document.getElementById("pofStatus").style.display = "none";
        document.getElementById("validationResult").style.display = "none";
        return;
    }

    showCurrentPhoto();
    renderPOFThumbnails();
    showValidationResult();
}

function previousPhoto() {
    if (!popPhotos.length) return;

    currentPhotoIndex--;

    if (currentPhotoIndex < 0) {
        currentPhotoIndex = popPhotos.length - 1;
    }

    showCurrentPhoto();
}

function nextPhoto() {
    if (!popPhotos.length) return;

    currentPhotoIndex++;

    if (currentPhotoIndex >= popPhotos.length) {
        currentPhotoIndex = 0;
    }

    showCurrentPhoto();
}

/* =========================================================
   VOF VIDEO UPLOAD
   ========================================================= */

function processVOFFile(files) {
    const file = files[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
        alert("Please attach a valid video file.");
        return;
    }

    if (vofVideoURL) URL.revokeObjectURL(vofVideoURL);

    includedFrames.forEach(frame => {
        if (frame.url) URL.revokeObjectURL(frame.url);
    });

    vofVideoFile = file;
    vofVideoURL = URL.createObjectURL(file);

    includedFrames = [];
    vofInvalidReasons = [];
    overallValidation = null;
    if (validationType) validationResults[validationType] = null;

    hideVOFReply();

    const videoElement = document.getElementById("vofVideo");

    videoElement.src = vofVideoURL;
    videoElement.load();

    document.getElementById("vofReviewer").style.display = "block";
    document.getElementById("includedSection").style.display = "none";
    document.getElementById("vofStatus").style.display = "block";

    document.getElementById("vofStatus").textContent =
        `Video attached: ${file.name}`;

    document.getElementById("validationResult").style.display = "none";
    document.getElementById("generateSection").style.display = "none";

    renderIncludedFrames();
}

document.getElementById("vofVideoInput").addEventListener("change", event => {
    processVOFFile(Array.from(event.target.files));
    event.target.value = "";
});

setupDropZone("vofDropZone", "vofVideoInput", processVOFFile);

/* =========================================================
   VOF VIDEO CONTROLS
   ========================================================= */

const video = document.getElementById("vofVideo");

video.addEventListener("loadedmetadata", function () {
    document.getElementById("videoTimeline").max = this.duration;
    updateVideoTime();
});

video.addEventListener("timeupdate", function () {
    document.getElementById("videoTimeline").value = this.currentTime;
    updateVideoTime();
});

document.getElementById("videoTimeline").addEventListener("input", function () {
    video.currentTime = Number(this.value);
    updateVideoTime();
});

function updateVideoTime() {
    if (!video.duration) return;

    document.getElementById("videoTime").textContent =
        `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function toggleVideo() {
    const button = document.getElementById("playPauseButton");

    if (video.paused) {
        video.play();
        button.textContent = "PAUSE";
    } else {
        video.pause();
        button.textContent = "PLAY";
    }
}

function moveVideo(seconds) {
    if (!video.duration) return;

    video.pause();

    video.currentTime = Math.max(
        0,
        Math.min(video.duration, video.currentTime + seconds)
    );

    document.getElementById("playPauseButton").textContent = "PLAY";
}

/* =========================================================
   VOF FRAME CAPTURE
   ========================================================= */

function includeCurrentFrame() {
    if (!video.videoWidth || !video.videoHeight) {
        alert("Please wait for the video to finish loading.");
        return;
    }

    video.pause();

    const timestamp = video.currentTime;

    if (includedFrames.some(frame => Math.abs(frame.time - timestamp) < 0.05)) {
        alert("This frame has already been included.");
        return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    canvas.toBlob(blob => {
        if (!blob) {
            alert("Unable to capture this video frame. Please try again.");
            return;
        }

        const file = new File(
            [blob],
            `VOF_Frame_${Date.now()}.jpg`,
            { type: "image/jpeg" }
        );

        includedFrames.push({
            id: Date.now() + Math.random(),
            time: timestamp,
            file,
            url: URL.createObjectURL(blob)
        });

        includedFrames.sort((a, b) => a.time - b.time);

        renderIncludedFrames();

        document.getElementById("includedSection").style.display = "block";

        overallValidation = null;
    if (validationType) validationResults[validationType] = null;
        vofInvalidReasons = [];

        hideVOFReply();

        document.getElementById("generateSection").style.display = "none";

        showValidationResult();
    }, "image/jpeg", 0.92);
}

function renderIncludedFrames() {
    const container = document.getElementById("includedFrames");

    container.innerHTML = "";

    includedFrames.forEach((frame, index) => {
        const card = document.createElement("div");
        card.className = "frame-card";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-frame";
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => {
            removeIncludedFrame(frame.id);
        });

        const image = document.createElement("img");
        image.src = frame.url;
        image.alt = "VOF Frame";

        const info = document.createElement("div");
        info.className = "frame-info";
        info.innerHTML = `Frame ${index + 1}<br>${formatTime(frame.time)}`;

        card.append(removeButton, image, info);
        container.appendChild(card);
    });
}

function removeIncludedFrame(id) {
    const index = includedFrames.findIndex(frame => frame.id === id);

    if (index === -1) return;

    URL.revokeObjectURL(includedFrames[index].url);

    includedFrames.splice(index, 1);

    overallValidation = null;
    if (validationType) validationResults[validationType] = null;
    vofInvalidReasons = [];

    hideVOFReply();

    renderIncludedFrames();

    document.getElementById("generateSection").style.display = "none";

    if (!includedFrames.length) {
        document.getElementById("includedSection").style.display = "none";
        document.getElementById("validationResult").style.display = "none";
    } else {
        showValidationResult();
    }
}

/* =========================================================
   SNID
   ========================================================= */

document.getElementById("snidInput").addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
    validateSNIDField();
});

function validateSNIDField() {
    const value = document.getElementById("snidInput").value.trim();
    const valid = SNID_REGEX.test(value);

    document.getElementById("snidError").style.display =
        value.length && !valid ? "block" : "none";

    document.getElementById("popAttachmentSection").style.display =
        valid ? "block" : "none";

    snid = valid ? value : "";
}

/* =========================================================
   POP FILE UPLOAD
   ========================================================= */

function processPOPFile(files) {
    const file = files[0];

    if (!file) return;

    const name = file.name.toLowerCase();

    const isJPEG =
        file.type === "image/jpeg" ||
        file.type === "image/jpg" ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg");

    const isPDF =
        file.type === "application/pdf" ||
        name.endsWith(".pdf");

    if (!isJPEG && !isPDF) {
        alert("Only JPEG/JPG or PDF files are allowed.");
        return;
    }

    if (popFileURL) URL.revokeObjectURL(popFileURL);

    popFile = file;
    popFileURL = URL.createObjectURL(file);
    overallValidation = null;
    if (validationType) validationResults[validationType] = null;
    popInvalidReasons = [];

    hidePOPReply();

    const infoText = document.getElementById("popFileInfoText");

    infoText.innerHTML = `
        <strong>Attachment:</strong> ${escapeHTML(file.name)}<br>
        <strong>Type:</strong> ${isJPEG ? "JPEG" : "PDF"}<br>
        <strong>Original Size:</strong> ${formatFileSize(file.size)}
    `;

    document.getElementById("popFileInfo").style.display = "block";

    document.getElementById("popImagePreview").style.display =
        isJPEG ? "block" : "none";

    document.getElementById("popPdfPreview").style.display =
        isPDF ? "block" : "none";

    if (isJPEG) {
        document.getElementById("popPreviewImage").src = popFileURL;
    }

    if (isPDF) {
        document.getElementById("popPdfPreview").src = popFileURL;
    }

    document.getElementById("popRemarksSection").style.display = "block";
    document.getElementById("validationResult").style.display = "block";
    document.getElementById("generateSection").style.display = "none";

    showValidationResult();
}

document.getElementById("popFileInput").addEventListener("change", event => {
    processPOPFile(Array.from(event.target.files));
    event.target.value = "";
});

setupDropZone("popDropZone", "popFileInput", processPOPFile);

/* =========================================================
   REMOVE POP FILE
   ========================================================= */

function removePOPFile() {
    if (popFileURL) URL.revokeObjectURL(popFileURL);

    popFile = null;
    popFileURL = null;
    overallValidation = null;
    if (validationType) validationResults[validationType] = null;
    popInvalidReasons = [];

    hidePOPReply();

    document.getElementById("popFileInput").value = "";
    document.getElementById("popFileInfo").style.display = "none";
    document.getElementById("popImagePreview").style.display = "none";
    document.getElementById("popPdfPreview").style.display = "none";
    document.getElementById("popPdfPreview").src = "";
    document.getElementById("popPreviewImage").src = "";
    document.getElementById("popRemarksSection").style.display = "none";
    document.getElementById("generatedRemarks").style.display = "none";
    document.getElementById("validationResult").style.display = "none";
    document.getElementById("generateSection").style.display = "none";
}

/* =========================================================
   POP REMARKS
   ========================================================= */

["purchaseDate", "storeName", "invoiceNumber"].forEach(id => {
    const element = document.getElementById(id);

    if (element) {
        element.addEventListener("input", updatePOPREMarks);
    }
});

function updatePOPREMarks() {
    const date = document.getElementById("purchaseDate").value;
    const store = document.getElementById("storeName").value.trim();
    const invoice = document.getElementById("invoiceNumber").value.trim();
    const output = document.getElementById("popRemarksOutput");

    if (date && store && invoice) {
        const parts = date.split("-");
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

        output.value = `POP SIGHTED & UPDATED | ${formattedDate} | ${store} | ${invoice}`;

        document.getElementById("generatedRemarks").style.display = "block";
    } else {
        output.value = "";
        document.getElementById("generatedRemarks").style.display = "none";
    }
}

async function copyPOPREMarks() {
    const text = document.getElementById("popRemarksOutput").value.trim();

    if (!text) {
        alert("Please complete the POP information first.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);

        const button = document.querySelector(".copy-remarks-button");

        if (button) {
            const old = button.textContent;
            button.textContent = "✓ COPIED";

            setTimeout(() => {
                button.textContent = old;
            }, 1500);
        }
    } catch {
        const output = document.getElementById("popRemarksOutput");
        output.select();
        document.execCommand("copy");
    }
}

/* =========================================================
   SHOW VALIDATION
   ========================================================= */

function showValidationResult() {
    let ready = false;

    if (validationType === "POF") {
        ready = popPhotos.length > 0;
    }

    if (validationType === "VOF") {
        ready = includedFrames.length > 0;
    }

    if (validationType === "POP") {
        ready = SNID_REGEX.test(snid) && !!popFile;
    }

    document.getElementById("validationResult").style.display =
        ready ? "block" : "none";
}

/* =========================================================
   VALID / INVALID
   ========================================================= */

function validateAll(isValid) {
    if (validationType) {
        completedPDFByType[validationType] = false;
        updateDoneButtonVisibility();
    }
    if (validationType === "POF") {
        if (!popPhotos.length) {
            alert("Please attach POF photos first.");
            return;
        }

        if (!isValid) {
            openPOFInvalidModal();
            return;
        }

        pofInvalidReasons = [];
    }

    if (validationType === "VOF") {
        if (!includedFrames.length) {
            alert("Please include at least one VOF frame.");
            return;
        }

        if (!isValid) {
            openVOFInvalidModal();
            return;
        }

        vofInvalidReasons = [];
        hideVOFReply();
    }

    if (validationType === "POP") {
        if (!SNID_REGEX.test(snid)) {
            alert("Please provide a valid 11-digit SNID.");
            return;
        }

        if (!popFile) {
            alert("Please attach the Proof of Purchase.");
            return;
        }

        const date = document.getElementById("purchaseDate").value;
        const store = document.getElementById("storeName").value.trim();
        const invoice = document.getElementById("invoiceNumber").value.trim();

        if (isValid && (!date || !store || !invoice)) {
            alert("Please complete Date of Purchase, Name of Store, and Invoice Number.");
            return;
        }

        if (!isValid) {
            openPOPInvalidModal();
            return;
        }

        popInvalidReasons = [];
        hidePOPReply();
        updatePOPREMarks();
    }

    overallValidation = isValid;
    validationResults[validationType] = isValid;

    document.getElementById("generateSection").style.display = "block";

    if (validationType === "POP") {
        const info = document.getElementById("popFileInfoText");

        if (info && popFile) {
            info.innerHTML = `
                <strong>Attachment:</strong> ${escapeHTML(popFile.name)}<br>
                <strong>Type:</strong> ${
                    popFile.name.toLowerCase().endsWith(".pdf") ? "PDF" : "JPEG"
                }<br>
                <strong>Original Size:</strong> ${formatFileSize(popFile.size)}<br>
                <strong>Validation:</strong> ${isValid ? "✓ VALID" : "✕ INVALID"}
            `;
        }
    }

    document.getElementById("generateSection").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   POF INVALID MODAL
   ========================================================= */

function openPOFInvalidModal() {
    const modal = document.getElementById("pofInvalidModal");
    if (!modal) return;

    modal.style.display = "flex";

    const error = document.getElementById("pofInvalidReasonError");
    if (error) error.style.display = "none";

    document.querySelectorAll("#pofInvalidReasons input").forEach(checkbox => {
        checkbox.checked = pofInvalidReasons.includes(checkbox.value);

        const parent = checkbox.closest(".pof-reason-option");

        if (parent) {
            parent.classList.toggle("selected", checkbox.checked);
        }
    });
}

function closePOFInvalidModal() {
    const modal = document.getElementById("pofInvalidModal");

    if (modal) {
        modal.style.display = "none";
    }
}

function confirmPOFInvalidReasons() {
    const selected = Array.from(
        document.querySelectorAll("#pofInvalidReasons input:checked")
    ).map(checkbox => checkbox.value);

    if (!selected.length) {
        const error = document.getElementById("pofInvalidReasonError");
        if (error) error.style.display = "block";
        return;
    }

    if (selected.includes("Others")) {
        const otherInput = document.getElementById("pofOtherReason");

        if (!otherInput || !otherInput.value.trim()) {
            alert("Please specify the reason under Others.");
            if (otherInput) otherInput.focus();
            return;
        }
    }

    pofInvalidReasons = selected;

    closePOFInvalidModal();

    overallValidation = false;
    validationResults.POF = false;

    document.getElementById("generateSection").style.display = "block";

    document.getElementById("generateSection").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   VOF INVALID MODAL
   ========================================================= */

function openVOFInvalidModal() {
    const modal = document.getElementById("vofInvalidModal");

    if (!modal) {
        alert("VOF invalid-reason modal is missing from the HTML.");
        return;
    }

    modal.style.display = "flex";

    const error = document.getElementById("vofInvalidReasonError");

    if (error) error.style.display = "none";

    document.querySelectorAll("#vofInvalidReasons input").forEach(checkbox => {
        checkbox.checked = vofInvalidReasons.includes(checkbox.value);

        const parent = checkbox.closest(".vof-reason-option");

        if (parent) {
            parent.classList.toggle("selected", checkbox.checked);
        }
    });
}

function closeVOFInvalidModal() {
    const modal = document.getElementById("vofInvalidModal");

    if (modal) {
        modal.style.display = "none";
    }
}

function confirmVOFInvalidReasons() {
    const selected = Array.from(
        document.querySelectorAll("#vofInvalidReasons input:checked")
    ).map(checkbox => checkbox.value);

    if (!selected.length) {
        const error = document.getElementById("vofInvalidReasonError");
        if (error) error.style.display = "block";
        return;
    }

    if (selected.includes("Others")) {
        const otherInput = document.getElementById("vofOtherReason");

        if (!otherInput || !otherInput.value.trim()) {
            alert("Please specify the reason under Others.");
            if (otherInput) otherInput.focus();
            return;
        }
    }

    vofInvalidReasons = selected;

    closeVOFInvalidModal();

    overallValidation = false;
    validationResults.VOF = false;

    hideVOFReply();

    document.getElementById("generateSection").style.display = "block";

    document.getElementById("generateSection").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   POP INVALID MODAL
   ========================================================= */

function openPOPInvalidModal() {
    const modal = document.getElementById("popInvalidModal");
    const error = document.getElementById("popInvalidModalError");
    const reasonsContainer = document.getElementById("popInvalidModalReasons");

    if (!modal || !reasonsContainer) {
        console.error("POP invalid modal elements are missing.");
        return;
    }

    if (error) {
        error.style.display = "none";
        error.textContent = "Please select at least one reason.";
    }

    reasonsContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = popInvalidReasons.includes(checkbox.value);

        const parent = checkbox.closest(".pof-reason-option");

        if (parent) {
            parent.classList.toggle("selected", checkbox.checked);
        }
    });

    const otherCheckbox = document.getElementById("popModalOtherCheckbox");
    const otherContainer = document.getElementById("popModalOtherReasonContainer");

    if (otherCheckbox && otherContainer) {
        otherContainer.style.display = otherCheckbox.checked ? "block" : "none";
    }

    modal.style.display = "flex";
}

function closePOPInvalidModal() {
    const modal = document.getElementById("popInvalidModal");

    if (modal) {
        modal.style.display = "none";
    }
}

function confirmPOPInvalidReasons() {
    if (confirmPOPInvalidReasons.processing) return;

    const reasonsContainer = document.getElementById("popInvalidModalReasons");
    const error = document.getElementById("popInvalidModalError");
    const otherInput = document.getElementById("popModalOtherReason");

    if (!reasonsContainer) {
        console.error("POP invalid reasons container was not found.");
        return;
    }

    const selectedCheckboxes = Array.from(
        reasonsContainer.querySelectorAll('input[type="checkbox"]:checked')
    );

    const selected = selectedCheckboxes.map(checkbox => checkbox.value);

    if (!selected.length) {
        if (error) {
            error.textContent = "Please select at least one invalid reason.";
            error.style.display = "block";
        }
        return;
    }

    if (selected.includes("Others")) {
        if (!otherInput || !otherInput.value.trim()) {
            if (error) {
                error.textContent = "Please enter the reason under Others.";
                error.style.display = "block";
            }

            if (otherInput) otherInput.focus();
            return;
        }
    }

    confirmPOPInvalidReasons.processing = true;

    try {
        popInvalidReasons = selected;
        overallValidation = false;
        validationResults.POP = false;

        closePOPInvalidModal();
        hidePOPReply();
        showPOPReply();

        document.getElementById("generateSection").style.display = "block";
    } finally {
        confirmPOPInvalidReasons.processing = false;
    }
}

/* =========================================================
   BUSINESS DAYS / DATE FORMAT
   ========================================================= */

function addBusinessDays(date, numberOfDays) {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < numberOfDays) {
        result.setDate(result.getDate() + 1);

        const day = result.getDay();

        if (day !== 0 && day !== 6) {
            addedDays++;
        }
    }

    return result;
}

function formatBusinessDate(date) {
    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function joinReasons(reasons) {
    if (reasons.length === 1) return reasons[0];
    if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;

    return `${reasons.slice(0, -1).join(", ")}, and ${reasons[reasons.length - 1]}`;
}

/* =========================================================
   POF VALID REPLY
   ========================================================= */

function createPOFValidReply() {
    return `Good day!

Thank you for contacting Acer Customer Support.

This email is to acknowledge that we have received the photos of your Acer product in relation to your Case ID: ${caseId}.

Please allow us 24-48 hours to progress your case from the time this email has been sent. We will provide you an update as soon as we can.

Thank you and have a nice day!

NOTE: Please DO NOT RESPOND to this email as this is not monitored for replies.

If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Kind regards,
Acer Customer Support Team`;
}

/* =========================================================
   POF INVALID REPLY
   ========================================================= */

function createPOFInvalidReply() {
    const deadline = addBusinessDays(new Date(), 5);

    const reasonMap = {
        "We need the picture of all sides of the device":
            "the photos do not show all sides of the device",

        "Sticker is not visible":
            "the sticker containing the device information is not clearly visible",

        "No front side included":
            "the front side of the device was not included",

        "No bottom part included":
            "the bottom part of the device was not included",

        "Need to include the whole screen that is working":
            "the whole screen showing that the device is working was not included"
    };

    const otherReason = document.getElementById("pofOtherReason");

    const reasons = pofInvalidReasons.map(reason => {
        if (reason === "Others") {
            return otherReason && otherReason.value.trim()
                ? otherReason.value.trim()
                : null;
        }

        return reasonMap[reason] || reason.toLowerCase();
    }).filter(Boolean);

    if (!reasons.length) {
        alert("Please select at least one invalid POF reason.");
        return "";
    }

    const reasonText = joinReasons(reasons);

    return `Good day!

Thank you for contacting Acer Customer Support.

We have received the photos of your Acer product in relation to your Case ID: ${caseId}. However, we are unable to validate the reported fault or damage based on the photos provided, as ${reasonText}.

May we kindly request that you send us another email with clear photos of your Acer product showing the reported fault or damage. Please ensure that all required areas of the device are clearly visible and that the photos are provided in the following file format:

• Photos: .jpg or .jpeg

You may send the email to pop.aca@acer.com with the SNID/Serial Number or Repair Case Number as the subject of the email.

Please be advised that we will close the case by ${formatBusinessDate(deadline)} if we do not receive a response within the specified period.

Thank you and have a nice day!

NOTE: Please DO NOT REPLY to this email, as this email address is not monitored for replies.

If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Kind regards,
Acer Customer Support Team`;
}

function showPOFReply() {
    if (validationType !== "POF") return;

    const reply = overallValidation
        ? createPOFValidReply()
        : createPOFInvalidReply();

    if (!reply) return;

    const textarea = document.getElementById("pofReplyTemplate");
    const status = document.getElementById("pofReplyStatus");
    const section = document.getElementById("pofReplySection");

    if (!textarea || !status || !section) return;

    textarea.value = reply;

    status.textContent = overallValidation ? "VALID" : "INVALID";

    status.className = "pof-reply-status " +
        (overallValidation ? "valid" : "invalid");

    section.style.display = "block";

    setTimeout(() => {
        section.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }, 150);
}

function hidePOFReply() {
    const section = document.getElementById("pofReplySection");
    const textarea = document.getElementById("pofReplyTemplate");
    const status = document.getElementById("pofReplyStatus");

    if (section) section.style.display = "none";
    if (textarea) textarea.value = "";
    if (status) status.textContent = "";
}

async function copyPOFReply() {
    const textarea = document.getElementById("pofReplyTemplate");

    if (!textarea || !textarea.value) return;

    try {
        await navigator.clipboard.writeText(textarea.value);

        const button = document.querySelector(".pof-copy-reply-button");

        if (button) {
            const original = button.textContent;
            button.textContent = "✓ COPIED";

            setTimeout(() => {
                button.textContent = original;
            }, 1500);
        }
    } catch {
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
    }
}

/* =========================================================
   VOF VALID REPLY
   ========================================================= */

function createVOFValidReply() {
    return `Good day!

Thank you for contacting Acer Customer Support.

This email is to acknowledge that we have received the video evidence of your Acer product in relation to your Case ID: ${caseId}.

Please allow us 24-48 hours to progress your case from the time this email has been sent. We will provide you with an update as soon as we can.

Thank you for your cooperation.

NOTE: Please DO NOT RESPOND to this email as this is not monitored for replies.

If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Kind regards,
Acer Customer Support Team`;
}

/* =========================================================
   VOF INVALID REPLY
   ========================================================= */

function createVOFInvalidReply() {
    const deadline = addBusinessDays(new Date(), 5);

    const reasonMap = {
        "The video does not show the reported fault":
            "the video does not clearly demonstrate the reported fault",

        "The video does not show the entire device":
            "the video does not show the entire device",

        "The reported fault is not visible":
            "the reported fault is not visible in the video",

        "The video is unclear or blurry":
            "the video is unclear or blurry, making it difficult to assess the reported fault",

        "The video does not show the device working":
            "the video does not show the device operating or the reported issue occurring",

        "The video is too short":
            "the video is too short to properly assess the reported fault"
    };

    const otherInput = document.getElementById("vofOtherReason");

    const reasons = vofInvalidReasons.map(reason => {
        if (reason === "Others") {
            return otherInput && otherInput.value.trim()
                ? otherInput.value.trim()
                : null;
        }

        return reasonMap[reason] || reason.toLowerCase();
    }).filter(Boolean);

    if (!reasons.length) {
        alert("Please select at least one invalid VOF reason.");
        return "";
    }

    const reasonText = joinReasons(reasons);

    return `Good day!

Thank you for contacting Acer Customer Support.

We have received the video evidence of your Acer product in relation to your Case ID: ${caseId}. However, we are unable to properly assess the reported fault based on the video provided, as ${reasonText}.

May we kindly request that you send us a replacement video clearly demonstrating the reported fault. Please ensure that the video is clear, shows the relevant areas of the device, and demonstrates the issue as it occurs.

You may send the video to pop.aca@acer.com with the SNID/Serial Number or Repair Case Number as the subject of your email.

Please be advised that we will close the case by ${formatBusinessDate(deadline)} if we do not receive a response within the specified period.

Thank you for your cooperation.

NOTE: Please DO NOT RESPOND to this email as this is not monitored for replies.

If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Kind regards,
Acer Customer Support Team`;
}

function showVOFReply() {
    if (validationType !== "VOF") return;

    const textarea = document.getElementById("vofReplyTemplate");
    const status = document.getElementById("vofReplyStatus");
    const section = document.getElementById("vofReplySection");

    if (!textarea || !status || !section) {
        alert("The VOF reply section is missing from the HTML.");
        return;
    }

    const reply = overallValidation
        ? createVOFValidReply()
        : createVOFInvalidReply();

    if (!reply) return;

    textarea.value = reply;

    status.textContent = overallValidation ? "VALID" : "INVALID";

    status.className = "vof-reply-status " +
        (overallValidation ? "valid" : "invalid");

    section.style.display = "block";

    setTimeout(() => {
        section.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }, 150);
}

function hideVOFReply() {
    const section = document.getElementById("vofReplySection");
    const textarea = document.getElementById("vofReplyTemplate");
    const status = document.getElementById("vofReplyStatus");

    if (section) section.style.display = "none";
    if (textarea) textarea.value = "";
    if (status) status.textContent = "";
}

async function copyVOFReply() {
    const textarea = document.getElementById("vofReplyTemplate");

    if (!textarea || !textarea.value.trim()) {
        alert("There is no VOF reply to copy.");
        return;
    }

    try {
        await navigator.clipboard.writeText(textarea.value);

        const button = document.querySelector(".vof-copy-reply-button");

        if (button) {
            const original = button.textContent;
            button.textContent = "✓ COPIED";

            setTimeout(() => {
                button.textContent = original;
            }, 1500);
        }
    } catch {
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
    }
}

/* =========================================================
   POP VALID REPLY
   ========================================================= */

function createPOPValidReply() {
    return `Good day!

Thank you for contacting Acer Customer Support.

This email is to acknowledge that we have received your Acer product's invoice in relation to your Case ID: ${caseId}. Our system will now be updated based on the information you have provided us.

Please allow 24-48 hours to progress your case from the time this email has been sent. We will provide you an update as soon as we can.

Thank you and have a nice day!

NOTE: Please DO NOT RESPOND to this email as this is not monitored for replies. If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Kind regards,

Acer Customer Support Team`;
}

/* =========================================================
   POP INVALID REPLY
   ========================================================= */

function createPOPInvalidReply() {
    const deadline = addBusinessDays(new Date(), 5);

    const reasonMap = {
        "Different name on invoice":
            "The name indicated on the invoice does not match the customer or authorised contact details provided for this case.",

        "Product listed doesn’t match the device lodged":
            "The product description or model indicated on the invoice does not appear to match the Acer device registered under this case.",

        "Product listed doesn't match the device lodged":
            "The product description or model indicated on the invoice does not appear to match the Acer device registered under this case.",

        "Invoice not readable":
            "The invoice provided is unclear or unreadable, preventing us from verifying the purchase details.",

        "No invoice number":
            "The invoice number is missing from the document provided.",

        "Incomplete details":
            "The invoice does not contain all the required purchase and seller information."
    };

    const otherInput = document.getElementById("popModalOtherReason")
        || document.getElementById("popOtherReason");

    const reasons = popInvalidReasons.map(reason => {
        if (reason === "Others") {
            return otherInput && otherInput.value.trim()
                ? `Additional information required: ${otherInput.value.trim()}`
                : null;
        }

        return reasonMap[reason] || reasonMap[reason.trim()] || reason;
    }).filter(Boolean);

    if (!reasons.length) {
        alert("Please select at least one invalid POP reason.");
        return "";
    }

    const missingDetails = [];

    popInvalidReasons.forEach(reason => {
        if (reason === "No invoice number") {
            missingDetails.push("Invoice Number");
        }

        if (reason === "Incomplete details") {
            missingDetails.push(
                "Store's details (Store Name, address and contact number)",
                "Tax ID / ABN / GST (indicating that the document is intended as a Tax Invoice)",
                "Invoice Number",
                "Date of Purchase",
                "Purchase Unit's Description and Price Details"
            );
        }
    });

    if (popInvalidReasons.includes("Different name on invoice")) {
        missingDetails.push("Correct purchaser's name or supporting authorisation, if applicable");
    }

    if (popInvalidReasons.some(reason =>
        reason === "Product listed doesn’t match the device lodged" ||
        reason === "Product listed doesn't match the device lodged"
    )) {
        missingDetails.push("Correct product description matching the device lodged");
    }

    if (popInvalidReasons.includes("Invoice not readable")) {
        missingDetails.push("A clear and readable copy of the invoice");
    }

    const uniqueMissingDetails = [...new Set(missingDetails)];

    const detailsText = uniqueMissingDetails.length
        ? `

May we request another copy of your invoice that addresses the following item(s):

${uniqueMissingDetails.map(item => `• ${item}`).join("\n")}`
        : "";

    const reasonText = reasons.map(reason => `• ${reason}`).join("\n");

    return `Good day!

Thank you for contacting Acer Customer Support.

We received the invoice of your Acer product that you have sent for your Case ID: ${caseId}. However, based on our review, the information indicated in the invoice is insufficient or requires clarification for the following reason(s):

${reasonText}${detailsText}

You may send your updated invoice or supporting documentation to pop.aca@acer.com with the SNID/Serial Number or the Repair Case Number as the subject of your email.

Please be advised that we will close the case by ${formatBusinessDate(deadline)} if no response is received.

Thank you and have a nice day!

NOTE: Please DO NOT RESPOND to this email as this is not monitored for replies. If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).

Kind regards,

Acer Customer Support Team`;
}

/* =========================================================
   SHOW POP REPLY
   ========================================================= */

function showPOPReply() {
    if (validationType !== "POP") return;

    const textarea = document.getElementById("popReplyTemplate");
    const status = document.getElementById("popReplyStatus");
    const section = document.getElementById("popReplySection");

    if (!textarea || !status || !section) {
        console.warn(
            "POP reply HTML is missing. Required IDs: popReplySection, popReplyTemplate, popReplyStatus."
        );
        return;
    }

    const reply = overallValidation
        ? createPOPValidReply()
        : createPOPInvalidReply();

    if (!reply) return;

    textarea.value = reply;

    status.textContent = overallValidation ? "VALID" : "INVALID";

    status.className = "pof-reply-status " +
        (overallValidation ? "valid" : "invalid");

    section.style.display = "block";

    setTimeout(() => {
        section.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }, 150);
}

function hidePOPReply() {
    const section = document.getElementById("popReplySection");
    const textarea = document.getElementById("popReplyTemplate");
    const status = document.getElementById("popReplyStatus");

    if (section) section.style.display = "none";
    if (textarea) textarea.value = "";
    if (status) status.textContent = "";
}

async function copyPOPReply() {
    const textarea = document.getElementById("popReplyTemplate");

    if (!textarea || !textarea.value.trim()) {
        alert("There is no POP reply to copy.");
        return;
    }

    try {
        await navigator.clipboard.writeText(textarea.value);

        const button = document.querySelector(".pop-copy-reply-button");

        if (button) {
            const original = button.textContent;
            button.textContent = "✓ COPIED";

            setTimeout(() => {
                button.textContent = original;
            }, 1500);
        }
    } catch {
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
    }
}

/* =========================================================
   GENERATE REPLY
   ========================================================= */

function generateReply() {
    if (!validationType) {
        alert("Please select POF, VOF, or POP first.");
        return;
    }

    if (!CASE_ID_REGEX.test(caseId)) {
        alert("Please enter a valid Case ID first.");
        return;
    }

    if (overallValidation === null) {
        alert("Please select VALID or INVALID first.");
        return;
    }

    if (validationType === "POF") {
        if (!popPhotos.length) {
            alert("Please attach at least one POF photo.");
            return;
        }

        if (overallValidation === false && !pofInvalidReasons.length) {
            openPOFInvalidModal();
            return;
        }

        showPOFReply();
        return;
    }

    if (validationType === "VOF") {
        if (!includedFrames.length) {
            alert("Please include at least one VOF video frame.");
            return;
        }

        if (overallValidation === false && !vofInvalidReasons.length) {
            openVOFInvalidModal();
            return;
        }

        showVOFReply();
        return;
    }

    if (validationType === "POP") {
        if (!SNID_REGEX.test(snid)) {
            alert("Please enter a valid 11-digit SNID.");
            return;
        }

        if (!popFile) {
            alert("Please attach the Proof of Purchase file.");
            return;
        }

        if (overallValidation === false && !popInvalidReasons.length) {
            openPOPInvalidModal();
            return;
        }

        showPOPReply();
        return;
    }
}

/* =========================================================
   GENERATE PDF
   ========================================================= */

async function generatePDF() {
    if (!CASE_ID_REGEX.test(caseId)) {
        alert("Incorrect Case ID.");
        return;
    }

    if (overallValidation === null) {
        alert("Please select VALID or INVALID first.");
        return;
    }

    if (overallValidation === false) {
        if (validationType === "POF" && !pofInvalidReasons.length) {
            openPOFInvalidModal();
            return;
        }

        if (validationType === "VOF" && !vofInvalidReasons.length) {
            openVOFInvalidModal();
            return;
        }

        if (validationType === "POP" && !popInvalidReasons.length) {
            openPOPInvalidModal();
            return;
        }
    }

    const button = document.getElementById("generatePDFButton");

    if (!button) {
        console.error("Generate PDF button not found.");
        return;
    }

    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "⏳ GENERATING HIGH-QUALITY PDF...";

    try {
        if (validationType === "POF") {
            await generateCompressedImagePDF(
                popPhotos,
                overallValidation
                    ? `${caseId}_validPOF.pdf`
                    : `${caseId}_invalidPOF.pdf`
            );

            showPOFReply();
            markPDFAndReplyComplete("POF");

        } else if (validationType === "VOF") {
            if (!includedFrames.length) {
                alert("Please include at least one VOF frame.");
                return;
            }

            await generateCompressedImagePDF(
                includedFrames.map(frame => frame.file),
                overallValidation
                    ? `${caseId}_validVOF.pdf`
                    : `${caseId}_invalidVOF.pdf`
            );

            showVOFReply();
            markPDFAndReplyComplete("VOF");

        } else if (validationType === "POP") {
            if (!popFile) {
                alert("Please attach the Proof of Purchase file.");
                return;
            }

            await generateCompressedPOPFilePDF(
                popFile,
                overallValidation
                    ? `${snid}_validPOP.pdf`
                    : `${snid}_invalidPOP.pdf`
            );

            showPOPReply();
            markPDFAndReplyComplete("POP");
        }

    } catch (error) {
        console.error("PDF generation failed:", error);

        alert("Unable to generate the PDF.\n\nPlease try again.");

    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

/* =========================================================
   IMAGE COMPRESSION
   ========================================================= */

async function compressImageFile(file, maxDimension, quality) {
    const dataURL = await fileToDataURL(file);
    const image = await loadImage(dataURL);

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    const scale = Math.min(
        1,
        maxDimension / Math.max(originalWidth, originalHeight)
    );

    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
        throw new Error("Unable to create the image compression canvas.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            result => {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error("Image compression failed."));
                }
            },
            "image/jpeg",
            quality
        );
    });

    return { blob, width, height };
}

/* =========================================================
   GENERATE IMAGE PDF — UNDER 4 MB
   ========================================================= */

async function generateCompressedImagePDF(files, filename) {
    if (!files || !files.length) {
        throw new Error("No images available to generate the PDF.");
    }

    let finalBlob = null;

    for (const setting of qualitySteps) {
        const candidateBlob = await buildImagePDF(files, setting);

        if (candidateBlob.size <= MAX_PDF_SIZE) {
            finalBlob = candidateBlob;
            break;
        }
    }

    if (!finalBlob) {
        throw new Error(
            "The PDF could not be reduced below 4 MB. Please remove some pages or images and try again."
        );
    }

    downloadBlob(finalBlob, filename);

    alert(
        "PDF generated successfully!\n\n" +
        "File size: " + formatFileSize(finalBlob.size) +
        "\n\nThe PDF is below 4 MB, with image quality optimised for readability."
    );
}

/* =========================================================
   BUILD IMAGE PDF
   ========================================================= */

async function buildImagePDF(files, setting) {
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        putOnlyUsedFonts: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 8;
    const header = 12;
    const footer = 10;

    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin - header - footer;

    for (let i = 0; i < files.length; i++) {
        if (i > 0) {
            pdf.addPage();
        }

        const compressed = await compressImageFile(
            files[i],
            setting.maxDimension,
            setting.quality
        );

        const imageData = await blobToDataURL(compressed.blob);

        const scale = Math.min(
            maxWidth / compressed.width,
            maxHeight / compressed.height
        );

        const width = compressed.width * scale;
        const height = compressed.height * scale;

        const x = (pageWidth - width) / 2;
        const y = margin + header + (maxHeight - height) / 2;

        pdf.setFillColor(23, 32, 51);
        pdf.rect(0, 0, pageWidth, 10, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);

        pdf.text("VALIDATION DOCUMENT", margin, 6.5);

        pdf.setFont("helvetica", "normal");

        pdf.text(
            `${validationType} • ${caseId}`,
            pageWidth - margin,
            6.5,
            { align: "right" }
        );

        pdf.addImage(
            imageData,
            "JPEG",
            x,
            y,
            width,
            height,
            undefined,
            "FAST"
        );

        pdf.setDrawColor(220, 224, 230);

        pdf.line(
            margin,
            pageHeight - 9,
            pageWidth - margin,
            pageHeight - 9
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(110, 115, 125);

        pdf.text(
            `Page ${i + 1} of ${files.length}`,
            margin,
            pageHeight - 4
        );

        pdf.setFont("helvetica", "bold");

        pdf.text(
            overallValidation ? "VALID" : "INVALID",
            pageWidth - margin,
            pageHeight - 4,
            { align: "right" }
        );
    }

    return pdf.output("blob");
}

/* =========================================================
   GENERATE POP PDF
   ========================================================= */

async function generateCompressedPOPFilePDF(file, filename) {
    if (!file) {
        throw new Error("POP file is missing.");
    }

    const name = file.name.toLowerCase();

    const isJPEG =
        file.type === "image/jpeg" ||
        file.type === "image/jpg" ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg");

    const isPDF =
        file.type === "application/pdf" ||
        name.endsWith(".pdf");

    if (isJPEG) {
        await generateCompressedImagePDF([file], filename);
        return;
    }

    if (isPDF) {
        await compressExistingPDF(file, filename);
        return;
    }

    throw new Error("Unsupported POP file.");
}

/* =========================================================
   COMPRESS EXISTING PDF — UNDER 4 MB
   ========================================================= */

async function compressExistingPDF(file, filename) {
    if (!window.pdfjsLib) {
        throw new Error("PDF.js is not loaded.");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const bytes = await file.arrayBuffer();

    const source = await pdfjsLib.getDocument({
        data: new Uint8Array(bytes)
    }).promise;

    const profiles = [
        { scale: 2.4, quality: 0.92 },
        { scale: 2.2, quality: 0.90 },
        { scale: 2.0, quality: 0.88 },
        { scale: 1.8, quality: 0.86 },
        { scale: 1.6, quality: 0.84 },
        { scale: 1.4, quality: 0.82 },
        { scale: 1.2, quality: 0.80 },
        { scale: 1.0, quality: 0.78 },
        { scale: 0.9, quality: 0.74 },
        { scale: 0.8, quality: 0.70 }
    ];

    let finalBlob = null;

    for (const profile of profiles) {
        const candidateBlob = await renderPDFCompressed(source, profile);

        if (candidateBlob.size <= MAX_PDF_SIZE) {
            finalBlob = candidateBlob;
            break;
        }
    }

    if (!finalBlob) {
        throw new Error(
            "The PDF could not be reduced below 4 MB. Try using a smaller or shorter PDF."
        );
    }

    downloadBlob(finalBlob, filename);

    alert(
        "POP PDF generated successfully!\n\n" +
        "File size: " + formatFileSize(finalBlob.size) +
        "\n\nThe PDF is below 4 MB, with quality optimised for readable invoice details."
    );
}

/* =========================================================
   RENDER EXISTING PDF
   ========================================================= */

async function renderPDFCompressed(source, profile) {
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        putOnlyUsedFonts: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
        if (pageNumber > 1) {
            pdf.addPage();
        }

        const page = await source.getPage(pageNumber);

        const viewport = page.getViewport({
            scale: profile.scale
        });

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
            throw new Error("Unable to create the PDF rendering canvas.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        await page.render({
            canvasContext: context,
            viewport
        }).promise;

        const imageBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Unable to compress the PDF page."));
                    }
                },
                "image/jpeg",
                profile.quality
            );
        });

        const imageData = await blobToDataURL(imageBlob);

        const ratio = Math.min(
            pageWidth / canvas.width,
            pageHeight / canvas.height
        );

        const width = canvas.width * ratio;
        const height = canvas.height * ratio;

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        pdf.addImage(
            imageData,
            "JPEG",
            x,
            y,
            width,
            height,
            undefined,
            "FAST"
        );

        canvas.width = 1;
        canvas.height = 1;
    }

    return pdf.output("blob");
}

/* =========================================================
   HELPERS
   ========================================================= */

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("File read failed."));

        reader.readAsDataURL(file);
    });
}

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("Blob conversion failed."));

        reader.readAsDataURL(blob);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Unable to load the image."));

        image.src = src;
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function formatFileSize(bytes) {
    if (!bytes) return "0 Bytes";

    const sizes = ["Bytes", "KB", "MB", "GB"];

    const index = Math.min(
        sizes.length - 1,
        Math.floor(Math.log(bytes) / Math.log(1024))
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   STANDARD IMAGE ZOOM VIEWER (POF / VOF)
   Click an image to open it. Use + / -, mouse wheel, or drag to pan.
   The viewer uses the image's original source and does not re-compress it.
   ========================================================= */

let zoomScale = 1;
let zoomTranslateX = 0;
let zoomTranslateY = 0;
let zoomDragging = false;
let zoomDragStartX = 0;
let zoomDragStartY = 0;
let zoomStartTranslateX = 0;
let zoomStartTranslateY = 0;
let zoomViewerReady = false;
let zoomDidDrag = false;

function ensureZoomViewer() {
    let overlay = document.getElementById("zoomOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "zoomOverlay";
        overlay.className = "zoom-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Image zoom viewer");
        document.body.appendChild(overlay);
    }

    let image = document.getElementById("zoomImage");
    if (!image) {
        image = document.createElement("img");
        image.id = "zoomImage";
        image.className = "zoom-image";
        image.alt = "Zoomed image";
        overlay.appendChild(image);
    }

    let toolbar = overlay.querySelector(".zoom-toolbar");
    if (!toolbar) {
        toolbar = document.createElement("div");
        toolbar.className = "zoom-toolbar";

        const makeButton = (className, text, label, handler) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = className;
            button.textContent = text;
            button.setAttribute("aria-label", label);
            button.addEventListener("click", event => {
                event.stopPropagation();
                handler();
            });
            toolbar.appendChild(button);
            return button;
        };

        makeButton("zoom-out", "−", "Zoom out", () => setZoomScale(zoomScale / 1.25));
        const level = document.createElement("span");
        level.className = "zoom-level";
        level.textContent = "100%";
        level.setAttribute("aria-live", "polite");
        toolbar.appendChild(level);
        makeButton("zoom-in", "+", "Zoom in", () => setZoomScale(zoomScale * 1.25));
        makeButton("zoom-reset", "⤢", "Reset zoom", resetZoomView);
        overlay.appendChild(toolbar);
    }

    let closeButton = overlay.querySelector(".zoom-close");
    if (!closeButton) {
        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "zoom-close";
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Close image viewer");
        overlay.appendChild(closeButton);
    }
    closeButton.onclick = closeZoom;

    let help = overlay.querySelector(".zoom-help");
    if (!help) {
        help = document.createElement("div");
        help.className = "zoom-help";
        help.textContent = "Scroll to zoom · Drag to move · Use + / − to zoom · Esc to close";
        overlay.appendChild(help);
    }

    if (!zoomViewerReady) {
        zoomViewerReady = true;

        overlay.addEventListener("click", event => {
            // The image ignores pointer events so clicks on it reach the overlay.
            // Do not close the viewer after the user has just dragged/panned.
            if (zoomDidDrag) {
                event.preventDefault();
                event.stopPropagation();
                zoomDidDrag = false;
                return;
            }
            if (event.target === overlay) closeZoom();
        });

        overlay.addEventListener("wheel", event => {
            if (overlay.style.display !== "flex") return;
            event.preventDefault();
            const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
            setZoomScale(zoomScale * factor);
        }, { passive: false });

        overlay.addEventListener("pointerdown", event => {
            if (event.target.closest(".zoom-toolbar, .zoom-close")) return;
            if (event.button !== 0 || zoomScale <= 1) return;
            zoomDragging = true;
            zoomDidDrag = false;
            zoomDragStartX = event.clientX;
            zoomDragStartY = event.clientY;
            zoomStartTranslateX = zoomTranslateX;
            zoomStartTranslateY = zoomTranslateY;
            overlay.classList.add("is-dragging");
            try { overlay.setPointerCapture(event.pointerId); } catch (_) {}
        });

        overlay.addEventListener("pointermove", event => {
            if (!zoomDragging) return;
            const deltaX = event.clientX - zoomDragStartX;
            const deltaY = event.clientY - zoomDragStartY;
            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) zoomDidDrag = true;
            zoomTranslateX = zoomStartTranslateX + deltaX;
            zoomTranslateY = zoomStartTranslateY + deltaY;
            applyZoomTransform();
        });

        const stopDragging = () => {
            zoomDragging = false;
            overlay.classList.remove("is-dragging");
        };
        overlay.addEventListener("pointerup", stopDragging);
        overlay.addEventListener("pointercancel", stopDragging);
    }

    return { overlay, image };
}

function updateZoomLevel() {
    const level = document.querySelector("#zoomOverlay .zoom-level");
    if (level) level.textContent = `${Math.round(zoomScale * 100)}%`;
}

function applyZoomTransform() {
    const image = document.getElementById("zoomImage");
    if (!image) return;
    image.style.transform = `translate(${zoomTranslateX}px, ${zoomTranslateY}px) scale(${zoomScale})`;
    updateZoomLevel();
}

function setZoomScale(value) {
    zoomScale = Math.max(1, Math.min(8, value));
    if (zoomScale === 1) {
        zoomTranslateX = 0;
        zoomTranslateY = 0;
    }
    applyZoomTransform();
}

function resetZoomView() {
    zoomScale = 1;
    zoomTranslateX = 0;
    zoomTranslateY = 0;
    applyZoomTransform();
}

function openZoom(src, altText = "Zoomed image") {
    if (!src) return;
    const viewer = ensureZoomViewer();
    viewer.image.onload = () => resetZoomView();
    zoomDidDrag = false;
    viewer.image.src = src;
    viewer.image.alt = altText || "Zoomed image";
    viewer.overlay.style.display = "flex";
    resetZoomView();
}

function closeZoom() {
    const overlay = document.getElementById("zoomOverlay");
    const image = document.getElementById("zoomImage");
    if (overlay) {
        overlay.style.display = "none";
        overlay.classList.remove("is-dragging");
    }
    if (image) {
        image.onload = null;
        image.removeAttribute("src");
        image.style.transform = "none";
    }
    zoomDragging = false;
    zoomDidDrag = false;
}

function attachImageZoom(image) {
    if (!image || image.dataset.zoomViewerAttached === "true") return;
    image.dataset.zoomViewerAttached = "true";
    image.style.cursor = "zoom-in";
    image.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openZoom(image.currentSrc || image.src, image.alt || "Zoomed image");
    });
}

const currentPhotoImage = document.getElementById("currentPhoto");
if (currentPhotoImage) attachImageZoom(currentPhotoImage);

// VOF frames are dynamically rendered, so attach the viewer after each render.
const originalRenderIncludedFrames = renderIncludedFrames;
renderIncludedFrames = function () {
    originalRenderIncludedFrames();
    const frameContainer = document.getElementById("includedFrames");
    if (frameContainer) frameContainer.querySelectorAll("img").forEach(attachImageZoom);
};

// Also support a POP image preview if it is displayed as an image.
const popPreviewImage = document.getElementById("popPreviewImage");
if (popPreviewImage) attachImageZoom(popPreviewImage);

/* =========================================================
   CLICK OUTSIDE MODALS
   ========================================================= */

const pofInvalidModal = document.getElementById("pofInvalidModal");

if (pofInvalidModal) {
    pofInvalidModal.addEventListener("click", function (event) {
        if (event.target === this) closePOFInvalidModal();
    });
}

const vofInvalidModal = document.getElementById("vofInvalidModal");

if (vofInvalidModal) {
    vofInvalidModal.addEventListener("click", function (event) {
        if (event.target === this) closeVOFInvalidModal();
    });
}

const popInvalidModal = document.getElementById("popInvalidModal");

if (popInvalidModal) {
    popInvalidModal.addEventListener("click", function (event) {
        if (event.target === this) closePOPInvalidModal();
    });
}

/* =========================================================
   HIGHLIGHT SELECTED INVALID REASONS
   ========================================================= */

document.querySelectorAll(".pof-reason-option input").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        const parent = this.closest(".pof-reason-option");

        if (parent) {
            parent.classList.toggle("selected", this.checked);
        }

        const error = document.getElementById("pofInvalidReasonError");

        if (error) error.style.display = "none";
    });
});

document.querySelectorAll(".vof-reason-option input").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        const parent = this.closest(".vof-reason-option");

        if (parent) {
            parent.classList.toggle("selected", this.checked);
        }

        const error = document.getElementById("vofInvalidReasonError");

        if (error) error.style.display = "none";
    });
});

document.querySelectorAll("#popInvalidModalReasons input").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        const parent = this.closest(".pof-reason-option, .pop-reason-option");

        if (parent) {
            parent.classList.toggle("selected", this.checked);
        }

        const error = document.getElementById("popInvalidModalError");

        if (error) error.style.display = "none";

        if (this.id === "popModalOtherCheckbox") {
            const otherContainer = document.getElementById("popModalOtherReasonContainer");

            if (otherContainer) {
                otherContainer.style.display = this.checked ? "block" : "none";
            }
        }
    });
});


/* =========================================================
   DONE BUTTON / RESET CURRENT CASE
   ========================================================= */

function addDoneButton() {
    if (document.getElementById("doneCaseButton")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "doneCaseButton";
    button.textContent = "DONE — FINISH CASE";
    button.style.cssText = [
        "display:none",
        "width:min(420px,90%)",
        "margin:32px auto 40px",
        "padding:15px 22px",
        "border:0",
        "border-radius:10px",
        "background:#198754",
        "color:#fff",
        "font-size:16px",
        "font-weight:700",
        "letter-spacing:.4px",
        "cursor:pointer",
        "box-shadow:0 4px 12px rgba(0,0,0,.15)"
    ].join(";");
    button.addEventListener("click", resetEntireCase);
    document.body.appendChild(button);
    updateDoneButtonVisibility();
}

function markPDFAndReplyComplete(type) {
    const config = {
        POF: ["pofReplySection", "pofReplyTemplate"],
        VOF: ["vofReplySection", "vofReplyTemplate"],
        POP: ["popReplySection", "popReplyTemplate"]
    }[type];
    const section = config && document.getElementById(config[0]);
    const reply = config && document.getElementById(config[1]);
    completedPDFByType[type] = !!(
        section && reply && reply.value.trim() &&
        getComputedStyle(section).display !== "none"
    );
    updateDoneButtonVisibility();
}

function updateDoneButtonVisibility() {
    const button = document.getElementById("doneCaseButton");
    if (!button) return;

    // Show Finish Case at the bottom after a validation reply is complete,
    // or whenever a reply-only template (missing proof / Additional Info) is shown.
    const validationComplete = !!(
        validationType &&
        completedPDFByType[validationType]
    );
    const replyTemplateVisible = ["POP", "POF", "VOF"].some(type => {
        const panel = document.getElementById(`additionalReplyTemplates-${type}`);
        return !!(panel && getComputedStyle(panel).display !== "none");
    });
    const validCase = CASE_ID_REGEX.test((document.getElementById("caseIdInput")?.value || "").trim());

    button.style.display = validCase && (validationComplete || replyTemplateVisible)
        ? "block" : "none";
}

function resetEntireCase() {
    if (!confirm("Mark this case as DONE and clear all fields?")) return;

    // Release object URLs before clearing the file references.
    if (vofVideoURL) URL.revokeObjectURL(vofVideoURL);
    if (popFileURL) URL.revokeObjectURL(popFileURL);
    includedFrames.forEach(frame => {
        if (frame.url) URL.revokeObjectURL(frame.url);
    });

    // Reset JavaScript state.
    validationType = null;
    caseId = "";
    overallValidation = null;
    validationResults.POF = null;
    validationResults.VOF = null;
    validationResults.POP = null;
    completedPDFByType.POF = false;
    completedPDFByType.VOF = false;
    completedPDFByType.POP = false;
    Object.keys(proofSubmissionChoiceByType).forEach(type => { proofSubmissionChoiceByType[type] = null; });
    Object.keys(replyOnlyTemplateByType).forEach(type => { replyOnlyTemplateByType[type] = null; });
    proofSubmissionChoice = null;
    updateDoneButtonVisibility();

    popPhotos = [];
    currentPhotoIndex = 0;
    vofVideoFile = null;
    vofVideoURL = null;
    includedFrames = [];
    popFile = null;
    popFileURL = null;
    snid = "";
    pofInvalidReasons = [];
    vofInvalidReasons = [];
    popInvalidReasons = [];

    // Clear every editable field and file input.
    document.querySelectorAll("input, textarea, select").forEach(element => {
        if (element.type === "checkbox" || element.type === "radio") {
            element.checked = false;
        } else if (element.type === "file") {
            element.value = "";
        } else {
            element.value = "";
        }
    });

    // Clear previews and generated content.
    [
        "currentPhoto",
        "popPreviewImage",
        "popPdfPreview",
        "zoomImage"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === "popPdfPreview") element.removeAttribute("src");
            else element.src = "";
        }
    });

    [
        "pofThumbnails",
        "includedFrames",
        "popFileInfoText",
        "popRemarksOutput"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if ("value" in element) element.value = "";
            else element.innerHTML = "";
        }
    });

    [
        "validationTypeSection",
        "pofUploadSection",
        "vofUploadSection",
        "popSection",
        "pofDropZone",
        "vofDropZone",
        "popDropZone",
        "photoViewer",
        "photoNavigation",
        "pofThumbnails",
        "pofStatus",
        "vofReviewer",
        "includedSection",
        "vofStatus",
        "popAttachmentSection",
        "popFileInfo",
        "popImagePreview",
        "popPdfPreview",
        "popRemarksSection",
        "generatedRemarks",
        "validationResult",
        "generateSection",
        "pofReplySection",
        "vofReplySection",
        "popReplySection",
        "zoomOverlay",
        "pofInvalidModal",
        "vofInvalidModal",
        "popInvalidModal",
        "proofSubmissionQuestion",
        "additionalReplyTemplates-POP",
        "additionalReplyTemplates-POF",
        "additionalReplyTemplates-VOF"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = "none";
    });

    [
        "caseIdError",
        "snidError",
        "pofInvalidReasonError",
        "vofInvalidReasonError",
        "popInvalidModalError"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = "none";
    });

    document.querySelectorAll(".type-button, .pof-reason-option, .vof-reason-option, .pop-reason-option")
        .forEach(element => element.classList.remove("selected"));

    const videoElement = document.getElementById("vofVideo");
    if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();
    }

    const timeline = document.getElementById("videoTimeline");
    if (timeline) timeline.value = 0;

    const videoTime = document.getElementById("videoTime");
    if (videoTime) videoTime.textContent = "00:00 / 00:00";

    const playPauseButton = document.getElementById("playPauseButton");
    if (playPauseButton) playPauseButton.textContent = "PLAY";

    document.querySelectorAll(".type-button").forEach(button => {
        button.classList.remove("selected");
    });

    const caseInput = document.getElementById("caseIdInput");
    if (caseInput) {
        caseInput.value = "";
        caseInput.focus();
    }

    ["POP", "POF", "VOF"].forEach(type => {
        const selector = document.getElementById(`additionalReplyTemplateSelect-${type}`);
        if (selector) selector.selectedIndex = 0;
        updateAdditionalReplyTemplate(type);
    });

    // Re-evaluate the Finish Case button only after the case ID and panels are cleared.
    updateDoneButtonVisibility();
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* =========================================================
   ADDITIONAL POP MAILBOX REPLY TEMPLATES
   ========================================================= */

const additionalReplyTemplateOptions = {
    POP: [
        { value: "no-pop", label: "No Proof of Purchase Attached" },
        { value: "additional-info", label: "Additional Information Received" }
    ],
    POF: [
        { value: "no-pof", label: "No Proof of Fault Attached" }
    ],
    VOF: [
        { value: "no-pof", label: "No Proof of Fault Attached" }
    ]
};

// User-created templates for the Additional Info workflow are saved in this browser.
const ADDITIONAL_INFO_STORAGE_KEY = "popWorkflowAdditionalInfoTemplates_v1";
function getSavedAdditionalInfoTemplates() {
    try {
        const saved = JSON.parse(localStorage.getItem(ADDITIONAL_INFO_STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter(item => item && item.id && item.name) : [];
    } catch (error) {
        return [];
    }
}
function saveAdditionalInfoTemplates(templates) {
    try {
        localStorage.setItem(ADDITIONAL_INFO_STORAGE_KEY, JSON.stringify(templates));
        return true;
    } catch (error) {
        alert("Unable to save the template in this browser. Check your browser storage settings and try again.");
        return false;
    }
}
function isCustomAdditionalInfoTemplate(templateKey) {
    return getSavedAdditionalInfoTemplates().some(template => template.id === templateKey);
}
function refreshAdditionalInfoTemplateOptions(selectedValue) {
    const selector = document.getElementById("additionalReplyTemplateSelect-POP");
    if (!selector) return;
    const saved = getSavedAdditionalInfoTemplates();
    selector.querySelectorAll("option[data-custom-additional-info='true']").forEach(option => option.remove());
    saved.forEach(template => {
        const option = document.createElement("option");
        option.value = template.id;
        option.textContent = template.name;
        option.dataset.customAdditionalInfo = "true";
        selector.appendChild(option);
    });
    if (selectedValue && Array.from(selector.options).some(option => option.value === selectedValue)) {
        selector.value = selectedValue;
    }
}

function createAdditionalReplyTemplate(type, templateKey) {
    const id = caseId || (document.getElementById("caseIdInput") || {}).value || "[Case ID]";
    const closureDate = formatBusinessDate(addBusinessDays(new Date(), 5));
    const greeting = "Dear (End User’s / Retailer’s Name),";
    const signature = `Kind regards,\nAcer Customer Support Team`;

    if (templateKey === "no-pop" && type === "POP") {
        return {
            subject: `Case ID: ${id} | No Proof of Purchase Attached`,
            body: `${greeting}\n\nGood day!\nThank you for contacting Acer Customer Support.\n\nWe received your email regarding the invoice of your Acer product that you have sent for your Case ID: ${id}. However, the email that you sent has no invoice attached to it. May we request for you to send us another email attaching the copy of your invoice which includes the following details (indicate only what is missing/incorrect from the invoice):\n\n• Store’s details (Store Name, address and contact number)\n• Tax ID / ABN / GST (indicating that the document is intended as a Tax Invoice)\n• Invoice Number\n• Date of Purchase\n• Purchase Unit’s Description and Price Details\n\nYou may send your e-mail to pop.aca@acer.com with the SNID/Serial Number or the Repair Case Number as the subject of your mail.\n\nPlease be advised that we will close the case by ${closureDate} if no response will be received.\n\nThank you and have a nice day!\n\nNOTE: Please DO NOT REPLY to this email as this is not being monitored. If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).\n\n${signature}`
        };
    }

    if (templateKey === "no-pof" && (type === "POF" || type === "VOF")) {
        return {
            subject: `Case ID: ${id} | No Photos or Videos Attached`,
            body: `${greeting}\n\nGood day!\nThank you for contacting Acer Customer Support.\n\nWe received your email regarding the proof of fault for your Acer product in relation to your Case ID: ${id}. However, the email that you sent has no photos or videos attached to it. May we request for you to send us another email attaching clear photos and/or videos of your Acer product showing the fault or damage. Please make sure to use the following file type or format:\n\n• Photos – .jpg, .jpeg\n• Videos – .mov, .mp4\n\nYou may send your e-mail to pop.aca@acer.com with the SNID/Serial Number or the Repair Case Number as the subject of your mail.\n\nPlease be advised that we will close the case by ${closureDate} if no response will be received.\n\nThank you and have a nice day!\n\nNOTE: Please DO NOT REPLY to this email as this is not being monitored. If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).\n\n${signature}`
        };
    }

    if (templateKey === "general-information" && type === "POP") {
        return {
            subject: "(Copy the Subject Line that the Customer / Retailer used)",
            body: `${greeting}\n\nI hope this email finds you well.\n\nThank you for reaching out to Acer Customer Support. Your inquiry is important to us, and we are committed to providing you with the best assistance possible.\n\nTo streamline our communication process, I would like to inform you that the email address pop.aca@acer.com is designated solely for receiving invoices, photos, and videos requested by our Acer Customer Support Team. Any correspondence unrelated to these purposes will regrettably be disregarded.\n\nFor prompt and efficient assistance with your concerns, please don't hesitate to contact us directly at 1300 365 100 (AU) / 0800 862 237 (NZ). Our dedicated team is available to address any questions or issues you may have.\n\nThank you for your understanding and cooperation in this matter. We value your partnership and aim to provide you with the best service possible.\n\nNOTE: Please DO NOT REPLY to this email as this is not being monitored.\n\nWarm regards,\nAcer Customer Support Team`
        };
    }

    if (templateKey === "additional-info" && type === "POP") {
        return {
            subject: "(Copy the Subject Line that the Customer / Retailer used)",
            body: `${greeting}\n\nGood day!\nThank you for contacting Acer Customer Support.\n\nWe have received your email about your Acer Product. This email will be forwarded to our specialist team. We will provide you an update as soon as we can. Please allow us up until the next business day to progress the case from the time you receive this email.\n\nThank you and have a nice day!\n\nNOTE: Please DO NOT REPLY to this email as this is not being monitored. If you have further concerns, please feel free to call us at 1300 365 100 (AU) / 0800 862 237 (NZ).\n\n${signature}`
        };
    }

    if (type === "POP") {
        const customTemplate = getSavedAdditionalInfoTemplates().find(template => template.id === templateKey);
        if (customTemplate) {
            // In custom templates, the exact token (Closure Date) is replaced
            // with the current date plus five business days (weekends excluded).
            // Re-rendering the template recalculates the date automatically.
            const replaceClosureDate = value => String(value || "").replace(/\(\s*Closure\s+Date\s*\)/gi, closureDate);
            return {
                subject: replaceClosureDate(customTemplate.subject),
                body: replaceClosureDate(customTemplate.body)
            };
        }
    }

    return { subject: "", body: "" };
}

function updateAdditionalReplyTemplate(type) {
    const selector = document.getElementById(`additionalReplyTemplateSelect-${type}`);
    const subject = document.getElementById(`additionalReplySubject-${type}`);
    const body = document.getElementById(`additionalReplyBody-${type}`);
    if (!selector || !subject || !body) return;

    const selectedKey = selector.value;
    const result = createAdditionalReplyTemplate(type, selectedKey);
    subject.value = result.subject;
    body.value = result.body;

    const addTemplateButton = document.getElementById("addAdditionalInfoTemplateButton");
    if (addTemplateButton) {
        addTemplateButton.style.display = (selectedKey === "additional-info" || isCustomAdditionalInfoTemplate(selectedKey)) ? "inline-flex" : "none";
    }
    const form = document.getElementById("addAdditionalInfoTemplateForm");
    if (form && !isCustomAdditionalInfoTemplate(selectedKey)) form.style.display = "none";
}

function copyAdditionalReplyField(fieldId, button) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value.trim()) return;
    const originalText = button.textContent;
    const finishCopy = () => {
        button.textContent = "Copied!";
        setTimeout(() => { button.textContent = originalText; }, 1200);
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(field.value).then(finishCopy).catch(() => {
            field.focus(); field.select(); document.execCommand("copy"); finishCopy();
        });
    } else {
        field.focus(); field.select(); document.execCommand("copy"); finishCopy();
    }
}

function createAdditionalReplyTemplatePanel(type) {
    const parent = document.getElementById("validationTypeSection");
    if (!parent || document.getElementById(`additionalReplyTemplates-${type}`)) return;

    const panel = document.createElement("section");
    panel.className = "additional-reply-templates";
    panel.id = `additionalReplyTemplates-${type}`;
    panel.innerHTML = `
        <div class="additional-reply-heading">
            <div>
                <div class="additional-reply-eyebrow">POP MAILBOX</div>
                <h3>Reply Templates</h3>
                <p>Select a template for ${type} validation. Case ID and closure date are filled in automatically when applicable.</p>
            </div>
        </div>
        <label class="additional-reply-label" for="additionalReplyTemplateSelect-${type}">Template</label>
        <select class="additional-reply-select" id="additionalReplyTemplateSelect-${type}">
            ${additionalReplyTemplateOptions[type].map(option => `<option value="${option.value}">${option.label}</option>`).join("")}
        </select>
        ${type === "POP" ? `
        <div class="additional-info-template-tools">
            <button type="button" class="additional-reply-copy" id="addAdditionalInfoTemplateButton">+ Add Template</button>
            <span>Save your own reusable replies for the Additional Info option.</span>
        </div>
        <div class="additional-info-template-form" id="addAdditionalInfoTemplateForm" style="display:none">
            <h4>Add an Additional Info Template</h4>
            <label class="additional-reply-label" for="newAdditionalInfoTemplateName">Template name</label>
            <input class="additional-reply-field" id="newAdditionalInfoTemplateName" type="text" maxlength="100" placeholder="e.g. Troubleshooting Instructions">
            <label class="additional-reply-label" for="newAdditionalInfoTemplateSubject">Email subject</label>
            <textarea class="additional-reply-field additional-reply-subject" id="newAdditionalInfoTemplateSubject" rows="2" placeholder="Enter the email subject"></textarea>
            <label class="additional-reply-label" for="newAdditionalInfoTemplateBody">Email reply</label>
            <textarea class="additional-reply-field additional-reply-body" id="newAdditionalInfoTemplateBody" rows="8" placeholder="Enter the reply template"></textarea>
            <div class="additional-reply-actions">
                <button type="button" class="additional-reply-copy secondary" id="cancelAdditionalInfoTemplateButton">Cancel</button>
                <button type="button" class="additional-reply-copy" id="saveAdditionalInfoTemplateButton">Save Template</button>
            </div>
        </div>` : ""}
        <label class="additional-reply-label" for="additionalReplySubject-${type}">Email subject</label>
        <textarea class="additional-reply-field additional-reply-subject" id="additionalReplySubject-${type}" rows="2" spellcheck="false"></textarea>
        <div class="additional-reply-field-heading">
            <label class="additional-reply-label" for="additionalReplyBody-${type}">Email reply</label>
            <button type="button" class="additional-reply-copy" data-copy-field="additionalReplyBody-${type}">Copy Reply</button>
        </div>
        <textarea class="additional-reply-field additional-reply-body" id="additionalReplyBody-${type}" rows="15" spellcheck="false"></textarea>
        <div class="additional-reply-actions">
            <button type="button" class="additional-reply-copy secondary" data-copy-field="additionalReplySubject-${type}">Copy Subject</button>
            <button type="button" class="additional-reply-copy" data-copy-field="additionalReplyBody-${type}">Copy Reply</button>
        </div>`;

    panel.style.display = "none";
    parent.appendChild(panel);

    const selector = panel.querySelector("select");
    if (type === "POP") refreshAdditionalInfoTemplateOptions();
    selector.addEventListener("change", () => updateAdditionalReplyTemplate(type));
    panel.querySelectorAll("button[data-copy-field]").forEach(button => {
        button.addEventListener("click", () => copyAdditionalReplyField(button.dataset.copyField, button));
    });

    if (type === "POP") {
        const addButton = panel.querySelector("#addAdditionalInfoTemplateButton");
        const form = panel.querySelector("#addAdditionalInfoTemplateForm");
        const nameField = panel.querySelector("#newAdditionalInfoTemplateName");
        const subjectField = panel.querySelector("#newAdditionalInfoTemplateSubject");
        const bodyField = panel.querySelector("#newAdditionalInfoTemplateBody");
        addButton.addEventListener("click", () => {
            form.style.display = form.style.display === "none" ? "block" : "none";
            if (form.style.display === "block") nameField.focus();
        });
        panel.querySelector("#cancelAdditionalInfoTemplateButton").addEventListener("click", () => {
            form.style.display = "none";
        });
        panel.querySelector("#saveAdditionalInfoTemplateButton").addEventListener("click", () => {
            const name = nameField.value.trim();
            const subjectValue = subjectField.value.trim();
            const bodyValue = bodyField.value.trim();
            if (!name) { alert("Please enter a template name."); nameField.focus(); return; }
            if (!subjectValue && !bodyValue) { alert("Please enter an email subject or reply body."); subjectField.focus(); return; }
            const templates = getSavedAdditionalInfoTemplates();
            const id = `custom-additional-info-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            templates.push({ id, name, subject: subjectValue, body: bodyValue });
            if (!saveAdditionalInfoTemplates(templates)) return;
            refreshAdditionalInfoTemplateOptions(id);
            form.style.display = "none";
            nameField.value = "";
            subjectField.value = "";
            bodyField.value = "";
            updateAdditionalReplyTemplate("POP");
        });
    }
    updateAdditionalReplyTemplate(type);
}

function hideAdditionalReplyTemplate(type) {
    const panel = document.getElementById(`additionalReplyTemplates-${type}`);
    if (panel) panel.style.display = 'none';
}

function showAdditionalReplyTemplate(type, templateKey) {
    ['POP', 'POF', 'VOF'].forEach(hideAdditionalReplyTemplate);
    const panel = document.getElementById(`additionalReplyTemplates-${type}`);
    const selector = document.getElementById(`additionalReplyTemplateSelect-${type}`);
    if (!panel || !selector) return;
    selector.value = templateKey;
    updateAdditionalReplyTemplate(type);
    panel.style.display = 'block';
    updateDoneButtonVisibility();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initializeProofSubmissionQuestion() {
    const section = document.getElementById('validationTypeSection');
    if (!section || document.getElementById('proofSubmissionQuestion')) return;

    const question = document.createElement('div');
    question.id = 'proofSubmissionQuestion';
    question.className = 'proof-submission-question';
    question.style.display = 'none';
    question.innerHTML = `
        <h3 id="proofSubmissionQuestionText">Did the customer / retailer submit the proof?</h3>
        <p>Select <strong>Yes</strong> to continue with validation, or <strong>No</strong> to show the matching auto-reply.</p>
        <div class="proof-submission-actions">
            <button type="button" class="proof-answer-yes">YES — PROOF SUBMITTED</button>
            <button type="button" class="proof-answer-no">NO — SHOW TEMPLATE</button>
        </div>`;
    section.appendChild(question);
    question.querySelector('.proof-answer-yes').addEventListener('click', () => handleProofSubmission('yes'));
    question.querySelector('.proof-answer-no').addEventListener('click', () => handleProofSubmission('no'));

    const popButton = document.getElementById('popTypeButton');
    if (popButton && !document.getElementById('additionalInfoTypeButton')) {
        const additionalButton = document.createElement('button');
        additionalButton.type = 'button';
        additionalButton.id = 'additionalInfoTypeButton';
        additionalButton.className = 'type-button additional-info-type-button';
        additionalButton.textContent = 'Additional Info';
        additionalButton.addEventListener('click', showAdditionalInfoTemplate);
        popButton.insertAdjacentElement('afterend', additionalButton);
    }
}

function initializeAdditionalReplyTemplates() {
    ["POP", "POF", "VOF"].forEach(createAdditionalReplyTemplatePanel);
    initializeProofSubmissionQuestion();
}


if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        addDoneButton();
        initializeAdditionalReplyTemplates();
    });
} else {
    addDoneButton();
    initializeAdditionalReplyTemplates();
}
