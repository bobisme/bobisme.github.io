# PostgreSQL Query Plan Visualizer

This tool allows you to visualize PostgreSQL query execution plans using
Mermaid diagrams.

## Features

- **Visualize Query Plans**: Paste your query plan JSON (from `EXPLAIN FORMAT
JSON`) to generate interactive diagrams.
- **EXPLAIN ANALYZE Support**: Optionally include output from `EXPLAIN ANALYZE`
  for more detailed insights.
- **Interactive Diagrams**: Diagrams are rendered using Mermaid.js and display
  the flow of query execution.
- **Highlight Expensive Operations**: Automatically highlights operations
  exceeding a cost threshold.
- **View Raw Mermaid Code**: Provides the raw Mermaid code for further
  customization or learning purposes.

## Getting Started

1. **Open the Application**: Simply open `index.html` in your web browser. No
   server is required since all resources are loaded via CDN.
2. **Paste Query Plan JSON**:
   - Obtain your query plan by running `EXPLAIN FORMAT JSON your_query;` in
     PostgreSQL.
   - Copy the resulting JSON output.
   - Paste it into the "Query Plan JSON (EXPLAIN FORMAT JSON)" textarea in the
     application.
3. **Optional - Include EXPLAIN ANALYZE Output**:
   - Run `EXPLAIN ANALYZE your_query;` to get runtime statistics.
   - Paste the output into the "EXPLAIN ANALYZE Output (Optional)" textarea.
4. **Visualize the Plan**:
   - Click the **Visualize Query Plan** button.
   - The visual representation of the query plan will appear below.
5. **Explore the Diagram**:
   - Hover over nodes for more details.
   - Nodes are color-coded based on their operation type (e.g., scans, joins, aggregates).
   - Expensive operations are highlighted for quick identification.
6. **View Raw Mermaid Code**:
   - Expand the "Show Raw Mermaid Code" section to view the underlying Mermaid syntax.

## Dependencies

The application leverages the following libraries, all loaded via CDN:

- **[Mermaid](https://mermaid.js.org/)**: For generating the diagrams.
- **[React](https://reactjs.org/)** and
  **[ReactDOM](https://reactjs.org/docs/react-dom.html)**: For building and
  rendering the user interface.
- **[Babel Standalone](https://babeljs.io/docs/en/babel-standalone)**: For
  in-browser transpilation of JSX.
- **[Tailwind CSS](https://tailwindcss.com/)**: For styling the application
  with utility classes.

_No additional installation is required._

## Customization

You can customize various aspects of the visualization:

- **Mermaid Configuration**: Adjust settings in the `mermaid.initialize` call
  within `main.js` to change themes, curves, padding, etc.
- **Cost Threshold**: Modify the `COST_THRESHOLD` value in the
  `convertPlanToMermaid` function to change when operations are considered
  expensive.
- **Node Type Descriptions**: Update the `nodeTypeDescriptions` mapping to
  alter how node types are labeled.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to
enhance the tool's functionality or fix bugs.

## License

This project is licensed under the MIT License.
