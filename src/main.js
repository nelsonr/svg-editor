import '../style.css'

import Konva from 'konva';
import { signal, effect, batch } from '@preact/signals-core';
import { exportStageSVG } from 'react-konva-to-svg';
import { isNumberAttribute, renderNodeAttribute, randomNumber, randomColor, createModal } from './utils';
import { renderConfigEditor, setupConfigEditorEvents } from './configEditor';

function importFromLocalStorage () {
    console.log("Importing from local storage...");

    const nodesData = localStorage.getItem("nodes");

    if (nodesData) {
        nodes.value = JSON.parse(nodesData);
    }
}

function saveToLocalStorage () {
    console.log("Saving to local storage...");
    localStorage.setItem("nodes", JSON.stringify(nodes.value));
}

function addNode (node) {
    nodes.value = nodes.value.concat(node);

    return nodes;
}

function addRect (x, y) {
    // Order of attributes matter when rendering on the Properties sidebar.
    return addNode({
        type: "rect",
        name: "Rect",
        id: self.crypto.randomUUID(),
        x: x,
        y: y,
        width: 70,
        height: 70,
        fill: randomColor(),
        stroke: randomColor(),
        strokeWidth: 4,
        draggable: true,
    });
}

function addCircle (x, y) {
    // Order of attributes matter when rendering on the Properties sidebar.
    return addNode({
        type: "circle",
        name: "Circle",
        id: self.crypto.randomUUID(),
        x: x,
        y: y,
        radius: 35,
        fill: randomColor(),
        stroke: randomColor(),
        strokeWidth: 4,
        draggable: true,
    });
}

function renderNode (node) {
    switch (true) {
        case node.type === "circle":
            return new Konva.Circle(node);

        case node.type === "rect":
            return new Konva.Rect(node);

        default:
            throw new Error("Node type not recgonized.");
    }
}

function renderNodeAttributes () {
    if (focusedNode.value) {
        const attrs = Object.entries(focusedNode.value.getAttrs());
        sidebarEl.innerHTML = attrs.map(renderNodeAttribute).join("");

        const inputs = sidebarEl.querySelectorAll("input");

        inputs.forEach((input) => {
            input.addEventListener("change", (ev) => {
                const nodeId = focusedNode.value.getId();
                updateNodeAttribute(nodeId, ev.target.name, ev.target.value);
            });
        });
    }
}

function updateNodeAttribute (nodeId, attrName, attrValue) {
    nodes.value = nodes.value.map((node) => {
        if (node.id === nodeId) {
            // Parse number attribute to avoid warnings in Konva
            if (isNumberAttribute(attrName)) {
                node[attrName] = Number(attrValue);
            } else {
                node[attrName] = attrValue;
            }
        }

        return node;
    });
}

function render () {
    console.log("Rendering...");

    layer.destroyChildren();

    nodes.value.forEach((item) => {
        const node = renderNode(item)
        layer.add(node)

        node.addEventListener("click", () => focusedNode.value = node);

        node.addEventListener("pointerdown", () => {
            batch(() => {
                focusedNode.value = node;
                isPointerDown.value = true;
            });
        });

        node.addEventListener("pointerup", updateNodes);
    });

    generateSVG();
}

function updateNodes () {
    console.log("Updating nodes...");
    nodes.value = layer.getChildren().map((node) => node.getAttrs());
}

function setup () {
    // First we need to create a stage
    stage = new Konva.Stage({
        container: 'editor',
        width: 400,
        height: 400,
    });

    // then create layer
    layer = new Konva.Layer();
    stage.add(layer);

    // Import stuff
    importFromLocalStorage();
    setupEventListeners();

    // Run stuff when signals change
    effect(saveToLocalStorage);
    effect(renderNodeAttributes);
    effect(render);
}

function renderSVGExport (svgDoc, isPreview = false) {
    const previewEl = document.querySelector(".export__body");

    if (previewEl && svgDoc) {
        if (isPreview) {
            previewEl.innerHTML = svgDoc.outerHTML;
        } else {
            const codePreviewEl = document.createElement("code");
            codePreviewEl.innerText = svgDoc.outerHTML;

            previewEl.innerHTML = null;
            previewEl.appendChild(codePreviewEl)
        }
    }
}

function postProcessSVG (svgCode) {
    const domParser = new DOMParser();
    const svgDoc = domParser.parseFromString(svgCode, "image/svg+xml");
    const paths = svgDoc.querySelectorAll("path");

    paths.forEach((path, index) => {
        const fill = path.getAttribute("fill");
        const stroke = path.getAttribute("stroke");

        if (fill) {
            path.setAttribute("fill", `var(--fill-${index}, ${fill})`);
        }

        if (stroke) {
            path.setAttribute("stroke", `var(--stroke-${index}, ${stroke})`);
        }
    });

    return svgDoc.documentElement;
}

async function generateSVG () {
    console.log("Generate SVG...");

    const result = await exportStageSVG(stage, false);
    const processedSVG = postProcessSVG(result);

    // Store processed SVG
    svg.value = processedSVG;

    renderSVGExport(processedSVG);
}

function showSVGPreview () {
    const modal = createModal();

    if (svg.value) {
        modal.innerHTML = renderConfigEditor(svg.value);
        setupConfigEditorEvents(modal);
        modal.showModal();
    }
}

function setupEventListeners () {
    let t = null;

    document.body.addEventListener("pointerup", () => {
        isPointerDown.value = false;
    });

    document.body.addEventListener("pointermove", () => {
        if (isPointerDown.value && focusedNode.value) {
            renderNodeAttributes();

            // Update nodes after drag ends
            clearTimeout(t);
            t = setTimeout(updateNodes, 500);
        }
    });

    addCircleButton.addEventListener("click", () => {
        const x = randomNumber(0, stage.width());
        const y = randomNumber(0, stage.height());
        addCircle(x, y);
    });

    addRectButton.addEventListener("click", () => {
        const x = randomNumber(0, stage.width());
        const y = randomNumber(0, stage.height());
        addRect(x, y);
    });

    resetButton.addEventListener("click", () => {
        nodes.value = [];
    });

    previewSVGButton.addEventListener("click", () => {
        showSVGPreview();
    });
}

const sidebarEl = document.querySelector(".sidebar__body");
const addCircleButton = document.getElementById("add-circle");
const addRectButton = document.getElementById("add-rect");
const resetButton = document.getElementById("reset");
const previewSVGButton = document.getElementById("preview-svg");

const isPointerDown = signal(false);
const nodes = signal([]);
const focusedNode = signal(null);
const svg = signal(null);
const config = signal({});

let stage, layer;

setup();
