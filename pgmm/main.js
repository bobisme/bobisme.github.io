// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  flowchart: {
    curve: "basis",
    padding: 100,
  },
});

// DOM Elements
const queryPlanInput = document.getElementById("queryPlan");
const explainAnalyzeInput = document.getElementById("explainAnalyze");
const visualizeButton = document.getElementById("visualize");
const errorDisplay = document.getElementById("error");
const diagramOutput = document.getElementById("diagramOutput");
const mermaidDiagram = document.getElementById("mermaidDiagram");
const rawMermaid = document.getElementById("rawMermaid");

// Enable/disable visualize button based on input
queryPlanInput.addEventListener("input", () => {
  visualizeButton.disabled = !queryPlanInput.value.trim();
});

// Convert PostgreSQL plan to Mermaid diagram
function convertPlanToMermaid(planData) {
  const plan = planData[0].Plan; // Get the main plan
  let mermaidCode = "graph TD\n";
  let nodeCounter = 0;

  function processNode(node, parentId = null) {
    const currentId = `node${nodeCounter++}`;

    // Create node label with costs
    const costs = `${node["Total Cost"].toFixed(2)}`;
    const rows =
      node["Actual Rows"] !== undefined ? `${node["Actual Rows"]} rows` : "";
    const actualTime = node["Actual Total Time"]
      ? `<br/>${node["Actual Total Time"].toFixed(2)}ms`
      : "";
    const nodeLabel = `${node["Node Type"]}<br/>${costs} cost${actualTime}<br/>${rows}`;

    // Add node definition
    mermaidCode += `    ${currentId}["${nodeLabel}"]\n`;

    // Add connection to parent if exists
    if (parentId !== null) {
      const relationship = node["Parent Relationship"]
        ? ` |${node["Parent Relationship"]}|`
        : "";
      mermaidCode += `    ${parentId} -->`;

      // Add additional info for specific node types
      if (node["Index Cond"]) {
        mermaidCode += `|${node["Index Cond"]}|`;
      } else if (node["Filter"]) {
        mermaidCode += `|${node["Filter"]}|`;
      }

      mermaidCode += ` ${currentId}\n`;
    }

    // Process child nodes if they exist
    if (node.Plans) {
      node.Plans.forEach((childNode) => {
        processNode(childNode, currentId);
      });
    }

    return currentId;
  }

  processNode(plan);
  return mermaidCode;
}

// Handle visualization
visualizeButton.addEventListener("click", async () => {
  try {
    // Parse and validate JSON
    const planData = JSON.parse(queryPlanInput.value);

    // Convert to Mermaid
    const mermaidCode = convertPlanToMermaid(planData);

    // Display raw code
    rawMermaid.textContent = mermaidCode;

    // Render diagram
    mermaidDiagram.innerHTML = "";
    const insertSvg = function (svgCode) {
      mermaidDiagram.innerHTML = svgCode;
    };

    // Render new diagram
    mermaid.render("mermaid-diagram", mermaidCode, insertSvg);

    // Show output
    diagramOutput.style.display = "block";
    errorDisplay.style.display = "none";
  } catch (err) {
    // Show error
    errorDisplay.textContent = "Error processing query plan: " + err.message;
    errorDisplay.style.display = "block";
    diagramOutput.style.display = "none";
  }
});
