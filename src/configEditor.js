import { effect, signal } from "@preact/signals-core";

const config = signal({});

// Log config when there's a change
effect(() => console.log(config.value));

export function renderConfigEditor (svg) {
    return `
        <div class="dialog-body">
            <div class="config-editor">
                <section class="preview">
                    <h3>Preview</h3>

                    <div>${svg.outerHTML}</div>
                </section>
                
                <div class="custom-properties-sidebar">
                    <h3>Custom Properties</h3>

                    <div class="custom-properties-list">${renderCustomProperties(svg)}</div>

                    <div class="row end">
                        <button id="custom-properties-save">Save</button>
                    </div>
                </div>
            </div>
            
            <section class="row end">
                <button id="modal-close">Close</button>
            </section>
        </div>
    `;
}


export function onReady (rootEl) {
    setupConfigEditorEvents(rootEl);
    onRender(rootEl);
}


export function onRender (rootEl) {
    const svgEl = rootEl.querySelector("svg");
    applyConfigToSVG(svgEl, config.value);
}

export function setupConfigEditorEvents (rootEl) {
    // Modal close button
    const closeButton = rootEl.querySelector("#modal-close");

    if (closeButton) {
        closeButton.addEventListener("click", () => {
            rootEl.dispatchEvent(new Event("close"));
        });
    }

    // Update color on SVG when color input changes
    const svgEl = rootEl.querySelector("svg");
    const colorInputs = rootEl.querySelectorAll("input[type=color]");
    colorInputs.forEach((input) => {
        input.addEventListener("change", (ev) => {
            svgEl.style.setProperty(ev.target.name, ev.target.value);
        });
    });

    // Button to save colors to config variable
    const saveButton = rootEl.querySelector("#custom-properties-save");

    if (saveButton) {
        saveButton.addEventListener("click", () => {
            const colorInputs = Array.from(rootEl.querySelectorAll("input[type=color]"));
            const computed = colorInputs
                .map((input) => ({ [input.name]: input.value }))
                .reduce((acc, val) => Object.assign(acc, val), {});

            config.value = computed;
        });
    }
}

function applyConfigToSVG (svgEl, config) {
    Object
        .entries(config)
        .map(([key, val]) => svgEl.style.setProperty(key, val));
}

function renderCustomProperties (svgEl) {
    let props = config.value;

    if (Object.keys(props).length === 0) {
        props = getCustomProperties(svgEl);
        config.value = props;
    }

    return Object
        .entries(props)
        .map(renderCustomProperty)
        .join("");
}


function renderCustomProperty ([key, value]) {
    return `
        <div class="attribute lowercase">
            <div class="attribute__label">${key}</div>
           
            <div class="attribute__value">
                <input type="color" name="${key}" value="${value}" />
            </div>
        </div>
    `;
}

function getCustomProperties (svgEl) {
    const paths = Array.from(svgEl.querySelectorAll("path"));

    return (
        paths
            .flatMap((path) => {
                return path.getAttributeNames()
                    .filter(isCustomProperty)
                    .map((attrName) => extractCustomProperty(path.getAttribute(attrName)))
                    .filter(Boolean);
            })
            .map(({ key, value }) => ({ [key]: value }))
            .reduce((acc, val) => Object.assign(acc, val), {})
    );
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

// Below is some possible examples of the for the definitions structure,
// as well a function to obtain the final computed config.

const exampleDefinitions = {
    "property-01": {
        "1": {
            "--fill-0": "red",
            "--stroke-0": "orange",
        },
        "2": {
            "--fill-0": "blue",
            "--stroke-0": "orange",
        },
    },
    "property-02": {
        "1": {
            "--stroke-0": "gold"
        },
        "2": {
            "--stroke-0": "pink"
        },
    }
};

const exampleConfig = {
    "property-01": 1,
    "property-02": 1,
};


function computeConfig (definitions, config) {
    return (
        Object.entries(config)
            .map(([key, val]) => definitions[key][val])
            .reduce((acc, val) => Object.assign(acc, val), {})
    );
}
