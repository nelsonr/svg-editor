export function renderNodeAttribute ([label, value]) {
    switch (true) {
        case label === "name":
            return renderTextAttribute(label, value);

        case isHiddenAttribute(label):
            return null;

        case isCoordinateAttribute(label):
            return renderCoordinateAttribute(label, value);

        case isColorAttribute(label):
            return renderColorAttribute(label, value);

        case isNumberAttribute(label):
            return renderNumberAttribute(label, value);

        default:
            return renderStaticAttribute(label, value);
    }
}

function renderStaticAttribute (label, value) {
    return `
        <div class="attribute">
            <div class="attribute__label">${label}</div>
            <div class="attribute__value">${value}</div>
        </div>
    `;
}

function renderCoordinateAttribute (label, value) {
    return `
        <div class="attribute">
            <div class="attribute__label">${label}</div>
            <div class="attribute__value">${value.toFixed(2)}</div>
        </div>
    `;
}

function renderTextAttribute (label, value) {
    return `
        <div class="attribute">
            <div class="attribute__label">${label}</div>
            
            <div class="attribute__value">
                <input type="text" name="${label}" value="${value}" />
            </div>
        </div>
    `;
}

function renderNumberAttribute (label, value) {
    return `
        <div class="attribute">
            <div class="attribute__label">${label}</div>
            
            <div class="attribute__value">
                <input type="number" name="${label}" value="${value}" />
            </div>
        </div>
    `;
}

function renderColorAttribute (label, value) {
    return `
        <div class="attribute">
            <div class="attribute__label">${label}</div>
            
            <div class="attribute__value">
                <input type="color" name="${label}" value="${value}" />
            </div>
        </div>
    `;
}

/**
 * Attributes that should be visibly hidden to the user.
 * 
 * @param {string} attributeName 
 * @returns boolean
 */
export function isHiddenAttribute (attributeName) {
    return [
        "id",
        "type",
        "draggable",
        "offsetX",
        "offsetY",
        "skewX",
        "skewY",
    ].includes(attributeName);
}

export function isColorAttribute (attributeName) {
    return [
        "fill",
        "stroke",
    ].includes(attributeName);
}

export function isCoordinateAttribute (attributeName) {
    return [
        "x",
        "y",
    ].includes(attributeName);
}

export function isNumberAttribute (attributeName) {
    return [
        "radius",
        "strokeWidth",
        "width",
        "height",
        "scaleX",
        "scaleY",
        "rotation",
    ].includes(attributeName);
}

export function randomNumber (min, max) {
    return Math.random() * (max - min) + min;
}

export function randomColor () {
    const n = (Math.random() * 0xfffff * 1000000).toString(16);

    return '#' + n.slice(0, 6);
}

export function createModal () {
    let dialog = document.querySelector("dialog");

    if (!dialog) {
        dialog = document.createElement("dialog");
        document.body.appendChild(dialog);

        dialog.addEventListener("close", (ev) => {
            dialog.close();
        })
    }

    return dialog;
}
