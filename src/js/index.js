require("./player-controller");

const addNotationButton = document.getElementById("add-notation");
const stopButton = document.getElementById("stop-button");

addNotationButton.addEventListener("click", handleAddNotationClick);

function handleAddNotationClick() {
  stopButton.click();

  const newNotation = document.createElement("ap-controller");
  addNotationButton.insertAdjacentElement("beforebegin", newNotation);
}
