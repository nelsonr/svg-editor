export function renderConfigEditor (svg) {
    return `
        <div class="dialog-body">
            <div class="config-editor">
                <div>
                    <header>
                        <h3>Preview</h3>
                    </header>
                    
                    <div>${svg.outerHTML}</div>
                </div>
                
                <div>
                    <header>
                        <h3>Custom Properties</h3>
                    </header>
            
                    <div>${renderCustomProperties(svg)}</div>
                </div>
            </div>
            
            <section class="row end">
                <button id="modal-close">Close</button>
            </section>
        </div>
    `;
}

export function setupConfigEditorEvents (el) {
    const closeButton = el.querySelector("#modal-close");

    if (closeButton) {
        closeButton.addEventListener("click", () => {
            el.dispatchEvent(new Event("close"));
        });
    }

    const svg = el.querySelector("svg");

    const colorInputs = el.querySelectorAll("input[type=color]");
    colorInputs.forEach((input) => {
        input.addEventListener("change", (ev) => {
            svg.style.setProperty(ev.target.name, ev.target.value);
        });
    });
}

function renderCustomProperties (svg) {
    const props = getCustomProperties(svg);

    return props.map(renderCustomProperty).join("");
}


function renderCustomProperty (prop) {
    return `
        <div class="attribute lowercase">
            <div class="attribute__label">${prop.key}</div>
           
            <div class="attribute__value">
                <input type="color" name="${prop.key}" value="${prop.value}" />
            </div>
        </div>
    `;
}

function getCustomProperties (svg) {
    const paths = Array.from(svg.querySelectorAll("path"));

    return paths.flatMap((path) => {
        return (
            path.getAttributeNames()
                .filter(isCustomProperty)
                .map((attrName) => extractCustomProperty(path.getAttribute(attrName)))
                .filter(Boolean)
        );
    });
}

/**
 * Extracts both custom property name and default value from attribute value.
 * 
 * E.g., The value `var(--fill-0, #00ff00)` will translate to the object:
 * 
 * `{ key: '--fill-0', value: '#00ff00' }`.
 * 
 * @param {string} attributeValue 
 * @returns Custom property object or false
 */
function extractCustomProperty (attributeValue) {
    const regex = /var\((.*), (.*)\)/i;
    const result = attributeValue.match(regex);

    if (result) {
        return {
            key: result[1],
            value: result[2]
        };
    }

    return false;
}

function isCustomProperty (attrName) {
    return [
        "fill",
        "stroke"
    ].includes(attrName);
}
