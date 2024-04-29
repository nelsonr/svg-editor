import './style.css'

import Konva from 'konva';
import { signal, effect, batch } from '@preact/signals-core';
import { exportStageSVG } from 'react-konva-to-svg';
import { isNumberAttribute, renderNodeAttribute } from './utils';

function randomNumber (min, max) {
    return Math.random() * (max - min) + min;
}

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

function addCircle (x, y) {
    return addNode({
        x: x,
        y: y,
        radius: 35,
        fill: '#FF0000',
        stroke: '#000000',
        strokeWidth: 4,
        draggable: true,
        id: self.crypto.randomUUID()
    });
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

    nodes.value.forEach((node) => {
        const circle = new Konva.Circle(node);
        layer.add(circle)

        circle.addEventListener("click", () => focusedNode.value = circle);

        circle.addEventListener("pointerdown", () => {
            // Set custom attributes
            circle.setAttr("name", circle.name() || "Node");

            batch(() => {
                focusedNode.value = circle;
                isPointerDown.value = true;
            });
        });

        circle.addEventListener("pointerup", updateNodes);
    });

    generateSVG();
}

function updateNodes () {
    console.log("Updating nodes...");
    nodes.value = layer.getChildren().map((node) => node.getAttrs());
}

function setup () {
    // first we need to create a stage
    stage = new Konva.Stage({
        container: 'editor',
        width: 400,
        height: 400,
    });

    // then create layer
    layer = new Konva.Layer();
    stage.add(layer);

    importFromLocalStorage();
    setupEventListeners();

    effect(saveToLocalStorage);
    effect(renderNodeAttributes);
    effect(render);
}

function renderSVGExport (svg, isPreview = false) {
    const previewEl = document.querySelector(".export__body");

    if (previewEl && svg) {
        if (isPreview) {
            previewEl.innerHTML = svg;
        } else {
            const codePreviewEl = document.createElement("code");
            codePreviewEl.innerText = svg;

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

    return svgDoc.documentElement.outerHTML;
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
    const dialog = document.createElement("dialog");

    if (svg.value) {
        if (document.querySelector("dialog")) {
            document.querySelector("dialog").remove();
        }

        document.body.appendChild(dialog);

        dialog.innerHTML = svg.value;

        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.addEventListener("click", () => dialog.close());
        dialog.appendChild(closeButton);

        dialog.showModal();
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
            t = setTimeout(updateNodes, 1000);
        }
    });

    addCircleButton.addEventListener("click", () => {
        const x = randomNumber(0, stage.width());
        const y = randomNumber(0, stage.height());

        addCircle(x, y);
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
const resetButton = document.getElementById("reset");
const previewSVGButton = document.getElementById("preview-svg");

const isPointerDown = signal(false);
const nodes = signal([]);
const focusedNode = signal(null);
const svg = signal(null);

let stage, layer;

setup();

// Just some debugging utilities

function getNodeAttributes (node) {
    return node.getAttrs();
}

window.getLayer = () => layer;
window.getLayerChildren = () => layer.getChildren().map(getNodeAttributes);
