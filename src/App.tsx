import InsertLink from "./Message";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    document.title = "Shopping List";
  }, []);
  return (
    <div style={{ position: "relative" }}>
      <title>Shopping List</title>
      <InsertLink />
    </div>
  );
}

export default App;
