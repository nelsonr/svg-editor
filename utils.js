export function renderNodeAttribute ([label, value]) {
    switch (true) {
        case ["stroke", "fill"].includes(label):
            return renderColorAttribute(label, value);

        case label === "name":
            return renderTextAttribute(label, value);

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

export function isNumberAttribute (attributeName) {
    return [
        "radius",
        "strokeWidth",
        "width",
        "height"
    ].includes(attributeName);
}
