import './style.css'
import Konva from 'konva';
import { signal, effect, batch } from '@preact/signals-core';
import { exportStageSVG } from 'react-konva-to-svg';

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
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });
}

function renderNodeAttribute ([label, value]) {
    return `
        <div class="attribute">
            <div class="attribute__label">${label}</div>
            <div class="attribute__value">${value}</div>
        </div>
    `;
}

function renderNodeAttributes () {
    if (focusedNode.value) {
        const attrs = Object.entries(focusedNode.value.getAttrs());
        sidebarEl.innerHTML = attrs.map(renderNodeAttribute).join("");
    }
}


function render () {
    layer.destroyChildren();

    nodes.value.forEach((node) => {
        const circle = new Konva.Circle(node);
        layer.add(circle)

        circle.addEventListener("click", () => focusedNode.value = circle);

        circle.addEventListener("pointerdown", () => {
            // Set custom attributes
            circle.setAttr("isActive", true);

            batch(() => {
                focusedNode.value = circle;
                isPointerDown.value = true;
            });
        });

        circle.addEventListener("pointerup", updateNodes);
    });

    console.log("Rendering...");
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

function renderSVGExport (svgCode) {
    const svgCodeEl = document.querySelector(".export__body");

    if (svgCodeEl && svgCode) {
        const codePreview = document.createElement("code");
        codePreview.innerText = svgCode;

        svgCodeEl.innerHTML = null;
        svgCodeEl.appendChild(codePreview)
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

    exportButton.addEventListener("click", async () => {
        console.log("Export...");
        const result = await exportStageSVG(stage, false);

        renderSVGExport(result);
    });
}

const sidebarEl = document.querySelector(".sidebar__body");
const addCircleButton = document.getElementById("add-circle");
const resetButton = document.getElementById("reset");
const exportButton = document.getElementById("export-svg");

const isPointerDown = signal(false);
const nodes = signal([]);
const focusedNode = signal(null);

let stage, layer;

setup();

// Just some debugging utilities

function getNodeAttributes (node) {
    return node.getAttrs();
}

window.getLayer = () => layer;
window.getLayerChildren = () => layer.getChildren().map(getNodeAttributes);
