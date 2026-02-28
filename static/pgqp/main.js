// Simple button component
const Button = React.forwardRef(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-blue-600 text-white shadow hover:bg-blue-700",
      outline:
        "border border-zinc-700 bg-transparent hover:bg-zinc-700 hover:text-zinc-100",
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-sm",
    };

    const classes = `${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`;

    return React.createElement(
      "button",
      { ref, className: classes, ...props },
      children,
    );
  },
);

// Textarea component
const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
  return React.createElement("textarea", {
    ref,
    className: `flex min-h-[60px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`,
    ...props,
  });
});

// Card components
const Card = React.forwardRef(({ className = "", ...props }, ref) => {
  return React.createElement("div", {
    ref,
    className: `rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 shadow ${className}`,
    ...props,
  });
});

// Icons
const Copy = ({ className = "", ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className}`}
      {...props}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
};

const Check = ({ className = "", ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className}`}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

const defaultQuery = `WITH active_orders AS ( SELECT order_id, customer_id, order_date, status FROM orders WHERE status = ANY($1) AND order_date BETWEEN $2 AND $3 AND total_amount > $4),
customer_tags AS ( SELECT c.customer_id, c.name, array_agg(t.tag_name) as tags FROM customers c LEFT JOIN customer_tags t ON c.customer_id = t.customer_id WHERE c.region = $5 AND (c.segment = ANY($6) OR c.vip_status = $7) GROUP BY c.customer_id, c.name)
SELECT ao.order_id, ao.order_date, ct.name as customer_name, ct.tags, EXISTS ( SELECT 1 FROM order_items oi WHERE oi.order_id = ao.order_id AND oi.product_id = ANY($8)) as has_premium_items FROM active_orders ao
JOIN customer_tags ct ON ao.customer_id = ct.customer_id
WHERE ao.order_id NOT IN ( SELECT order_id FROM order_problems WHERE problem_type = ANY($9))
AND (ct.tags && $10)  -- array overlap operator
ORDER BY ao.order_date DESC
LIMIT $11;`;

const defaultParams = JSON.stringify([
  ["processing", "pending", "approved"],
  "2024-01-01",
  "2024-03-15",
  1000.5,
  "NORTH_AMERICA",
  ["enterprise", "mid_market"],
  true,
  [101, 102, 103, 104],
  ["delivery_delay", "payment_failed"],
  ["vip", "promotional", "seasonal"],
  50,
]);

// Main Application Component
const SQLParameterizer = () => {
  const [query, setQuery] = React.useState(defaultQuery);
  const [params, setParams] = React.useState(defaultParams);
  const [result, setResult] = React.useState("");
  const [error, setError] = React.useState("");
  const [formatter, setFormatter] = React.useState(null);
  const [copyButtonText, setCopyButtonText] = React.useState("Copy SQL");
  const [isCopySuccess, setIsCopySuccess] = React.useState(false);

  React.useEffect(() => {
    setFormatter(window.sqlFormatter);
  }, []);

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = result;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      setIsCopySuccess(true);
      setCopyButtonText("Copied!");
      setTimeout(() => {
        setIsCopySuccess(false);
        setCopyButtonText("Copy SQL");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const formatArrayForPostgres = (arr, isStringArray = false) => {
    if (arr.length === 0) return "'{}'";

    // Check if all elements are strings
    const allStrings = arr.every((val) => typeof val === "string");

    // For string arrays, use the {a,b,c} format
    if (allStrings || isStringArray) {
      const escapedValues = arr.map((val) => {
        if (val === null) return "NULL";
        // Escape special characters and quotes
        const escaped = val
          .toString()
          .replace(/"/g, '\\"') // Escape double quotes
          .replace(/'/g, "''"); // Double single quotes for Postgres
        return `"${escaped}"`;
      });
      return `'{${escapedValues.join(",")}}'`;
    }

    // For numeric arrays, use the {1,2,3} format
    const formattedValues = arr.map((val) => {
      if (val === null) return "NULL";
      return val;
    });
    return `'{${formattedValues.join(",")}}'`;
  };

  const interpolateParams = () => {
    try {
      if (!formatter) {
        throw new Error("SQL formatter is not yet loaded");
      }

      // Parse the parameters
      const paramArray = JSON.parse(params);
      if (!Array.isArray(paramArray)) {
        throw new Error("Parameters must be a JSON array");
      }

      // Create a copy of the query for interpolation
      let interpolatedQuery = query;

      // Replace each parameter placeholder with its value
      paramArray.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let paramValue;

        if (Array.isArray(param)) {
          // Check if this parameter is used in an ANY clause
          const anyPattern = new RegExp(
            `ANY\\s*\\(\\s*\\${index + 1}\\s*\\)`,
            "i",
          );
          if (anyPattern.test(interpolatedQuery)) {
            // Format as a Postgres array literal
            const isStringArray = param.some((val) => typeof val === "string");
            paramValue = formatArrayForPostgres(param, isStringArray);
          } else {
            paramValue = formatArrayForPostgres(param);
          }
        } else if (typeof param === "string") {
          paramValue = `'${param.replace(/'/g, "''")}'`;
        } else if (param === null) {
          paramValue = "NULL";
        } else {
          paramValue = param;
        }

        // Use regex to replace all occurrences of this placeholder
        const regex = new RegExp("\\" + placeholder + "\\b", "g");
        interpolatedQuery = interpolatedQuery.replace(regex, paramValue);
      });

      // Format the interpolated query using sql-formatter
      const formattedQuery = formatter.format(interpolatedQuery, {
        language: "postgresql",
        uppercase: true,
        indent: "  ", // 4 spaces
        keywordCase: "upper",
        linesBetweenQueries: 2,
        tabWidth: 2,
        useTabs: false,
        maxColumnLength: 50,
        paramTypes: {
          custom: ["$[0-9]+"],
        },
        params: paramArray,
      });

      setResult(formattedQuery);
      setError("");
    } catch (err) {
      setError(err.message);
      setResult("");
    }
  };

  // Update syntax highlighting when result changes
  React.useEffect(() => {
    if (window.Prism && result) {
      window.Prism.highlightAll();
    }
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-zinc-900 min-h-screen text-zinc-100">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-100">
              PostgreSQL Query with Parameters ($1, $2, etc.)
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-mono h-32"
              placeholder="Enter your SQL query here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-100">
              Parameters (JSON Array)
            </label>
            <Textarea
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className="font-mono h-32"
              placeholder="Enter parameters as JSON array..."
            />
          </div>

          <Button
            onClick={interpolateParams}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Format and Interpolate Query
          </Button>

          {error && (
            <div className="text-red-400 text-sm mt-2">Error: {error}</div>
          )}

          {result && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-zinc-100">
                  Formatted Query
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className={`h-8 transition-all duration-200 ${
                    isCopySuccess
                      ? "bg-green-600 text-white border-green-500 hover:bg-green-700"
                      : "border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  {isCopySuccess ? (
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      {copyButtonText}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Copy className="h-4 w-4 mr-1" />
                      {copyButtonText}
                    </span>
                  )}
                </Button>
              </div>
              <pre className="rounded-lg bg-[#1e1e1e] p-4 overflow-x-auto relative">
                <code className="language-sql">{result}</code>
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Render the application
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(SQLParameterizer));
