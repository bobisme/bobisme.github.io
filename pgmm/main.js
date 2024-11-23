const { useState, useEffect } = React;

// Escape function for Mermaid labels
const escapeMermaidText = (text) => {
  if (!text) return "";
  return text
    .replace(/["\\]/g, "\\$&") // Escape double quotes and backslashes
    .replace(/[\n\r]/g, " "); // Replace newlines and carriage returns with space
};

mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  flowchart: {
    curve: "basis",
    padding: 30, // Adjust padding as needed
    useMaxWidth: false,
  },
});

// Function to humanize times
const formatTime = (timeInMs) => {
  if (timeInMs < 1000) {
    return `${timeInMs.toFixed(0)}ms`;
  } else {
    return `${(timeInMs / 1000).toFixed(2)}s`;
  }
};

// Function to format numbers with commas and abbreviations
const formatNumber = (number) => {
  if (number < 1000) {
    return number.toString();
  } else if (number < 1_000_000) {
    return (number / 1000).toFixed(1) + "k";
  } else if (number < 1_000_000_000) {
    return (number / 1_000_000).toFixed(1) + "M";
  } else {
    return (number / 1_000_000_000).toFixed(1) + "B";
  }
};

// Function to add commas as thousands separators
const formatWithCommas = (number) => {
  return number.toLocaleString();
};

const App = () => {
  const [queryPlan, setQueryPlan] = useState("");
  const [explainAnalyze, setExplainAnalyze] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [error, setError] = useState("");
  const [showDiagram, setShowDiagram] = useState(false);
  const [renderedDiagram, setRenderedDiagram] = useState("");

  const handleVisualize = async () => {
    try {
      const planData = JSON.parse(queryPlan);
      const code = convertPlanToMermaid(planData);
      setMermaidCode(code);
      setShowDiagram(true);
      setError("");
      // Save the query plan to localStorage
      localStorage.setItem("savedQueryPlan", queryPlan);
    } catch (err) {
      setError("Error processing query plan: " + err.message);
      setShowDiagram(false);
    }
  };

  useEffect(() => {
    if (mermaidCode) {
      mermaid
        .render("mermaid-diagram", mermaidCode)
        .then(({ svg }) => {
          setRenderedDiagram(svg);
          setError("");
        })
        .catch((err) => {
          setError("Error rendering diagram: " + err.message);
        });
    }
  }, [mermaidCode]);

  // Load the saved query plan from localStorage, if it exists
  useEffect(() => {
    const savedPlan = localStorage.getItem("savedQueryPlan");
    if (savedPlan) {
      setQueryPlan(savedPlan);
    }
  }, []);

  const convertPlanToMermaid = (planData) => {
    const plan = planData[0].Plan;
    const totalExecutionTime = plan["Actual Total Time"];
    if (!totalExecutionTime) {
      throw new Error("Actual Total Time is not available in the root node.");
    }
    let mermaidCode = "graph LR\n";
    let nodeCounter = 0;

    // Node type descriptions mapping
    const nodeTypeDescriptions = {
      "Seq Scan": "Sequential Scan",
      "Index Scan": "Index Scan",
      "Index Only Scan": "Index Only Scan",
      "Bitmap Heap Scan": "Bitmap Heap Scan",
      "Bitmap Index Scan": "Bitmap Index Scan",
      "Nested Loop": "Nested Loop Join",
      "Hash Join": "Hash Join",
      "Merge Join": "Merge Join",
      Aggregate: "Aggregate Operation",
      // Add more mappings as needed
    };

    const processNode = (node, parentId = null, totalExecutionTime) => {
      const currentId = `node${nodeCounter++}`;
      const costs = `${node["Total Cost"].toFixed(1)}`;
      const rows =
        node["Actual Rows"] !== undefined ? `${node["Actual Rows"]} rows` : "";
      const nodeType = node["Node Type"];
      let nodeDescription = nodeTypeDescriptions[nodeType] || nodeType;
      let scanTarget = "";

      if (
        nodeType === "Seq Scan" ||
        nodeType === "Index Scan" ||
        nodeType === "Index Only Scan"
      ) {
        if (node["Relation Name"]) {
          scanTarget = node["Relation Name"];
        }
        if (node["Index Name"]) {
          scanTarget = node["Index Name"];
        }
      }

      let st = "";
      if (scanTarget) {
        st = ` - <span style=color:lightyellow>${scanTarget}</span>`;
      }
      // const totalCost = node["Total Cost"]
      //   ? `Cost: ${node["Total Cost"].toFixed(2)}`
      //   : "";
      // const actualRows =
      //   node["Actual Rows"] !== undefined ? `Rows: ${node["Actual Rows"]}` : "";
      const actualTime = node["Actual Total Time"]
        ? `Time: ${node["Actual Total Time"].toFixed(1)}ms`
        : "";
      const timePercentage = (
        (node["Actual Total Time"] / totalExecutionTime) *
        100
      ).toFixed(1);

      const actualTimeStr = node["Actual Total Time"]
        ? `${formatTime(node["Actual Total Time"])} (${timePercentage}%)`
        : "";

      const nodeLabel = escapeMermaidText(
        `<strong>${nodeDescription}</strong>${st}<br>${actualTimeStr}`,
      );

      // Determine node class
      let nodeClass = "";
      if (nodeType.includes("Scan")) {
        nodeClass = "scan";
      } else if (nodeType.includes("Join")) {
        nodeClass = "join";
      } else if (nodeType.includes("Aggregate")) {
        nodeClass = "aggregate";
      }

      // Highlight expensive nodes
      const COST_THRESHOLD = 1000; // Adjust threshold as needed
      if (node["Total Cost"] > COST_THRESHOLD) {
        nodeClass = "expensive";
      }

      // Add node with class
      mermaidCode += `    ${currentId}["${escapeMermaidText(nodeLabel)}"]${nodeClass ? `:::${nodeClass}` : ""}\n`;

      // Add edge from parent to current node
      if (parentId !== null) {
        let edgeLabel = "";
        if (node["Actual Rows"] !== undefined) {
          edgeLabel = formatNumber(node["Actual Rows"]);
        }
        mermaidCode += `    ${parentId} -->${edgeLabel ? `|"${edgeLabel}"|` : ""} ${currentId}\n`;
      }

      // Process child nodes
      if (node.Plans) {
        node.Plans.forEach((childNode) => {
          processNode(childNode, currentId, totalExecutionTime);
        });
      }

      return currentId;
    };

    processNode(plan, null, totalExecutionTime);
    // Add class definitions
    mermaidCode += `
      classDef scan fill:#1e7a96,stroke:#219ebc,stroke-width:2px;
      classDef join fill:#00b703,stroke:#fb8500,stroke-width:2px;
      classDef aggregate fill:#9b5de5,stroke:#f15bb5,stroke-width:2px;
      classDef expensive fill:#00006e,stroke:#8338ec,stroke-width:4px;
    `;

    return mermaidCode;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gray-800 rounded-lg p-6 mt-4">
        <h1 className="text-2xl text-white">
          PostgreSQL Query Plan Visualizer
        </h1>
        <div className="mb-4">
          <label htmlFor="queryPlan" className="text-white">
            Query Plan JSON (EXPLAIN FORMAT JSON)
          </label>
          <textarea
            id="queryPlan"
            className="w-full p-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded"
            placeholder="Paste your query plan JSON here..."
            rows="20"
            value={queryPlan}
            onChange={(e) => setQueryPlan(e.target.value)}
          ></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="explainAnalyze" className="text-white">
            EXPLAIN ANALYZE Output (Optional)
          </label>
          <textarea
            id="explainAnalyze"
            className="w-full p-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded"
            placeholder="Paste your EXPLAIN ANALYZE output here (optional)..."
            value={explainAnalyze}
            onChange={(e) => setExplainAnalyze(e.target.value)}
          ></textarea>
        </div>
        {error && (
          <div className="bg-red-600 text-white p-2 rounded mb-4">{error}</div>
        )}
        <button
          onClick={handleVisualize}
          disabled={!queryPlan}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-gray-600"
        >
          Visualize Query Plan
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("savedQueryPlan");
            setQueryPlan("");
            setMermaidCode("");
            setRenderedDiagram("");
            setShowDiagram(false);
          }}
          className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-500 mt-2"
        >
          Clear Saved Plan
        </button>
        {showDiagram && (
          <div
            id="diagramOutput"
            className="bg-gray-800 p-4 rounded mt-4 overflow-x-auto"
          >
            <div
              id="mermaidDiagram"
              dangerouslySetInnerHTML={{ __html: renderedDiagram }}
            ></div>
            <details className="mt-4">
              <summary className="cursor-pointer text-gray-300">
                Show Raw Mermaid Code
              </summary>
              <pre
                id="rawMermaid"
                className="bg-gray-700 p-2 rounded border border-gray-600"
              >
                {mermaidCode}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
