document.addEventListener("DOMContentLoaded", function () {
  // Get the modal
  var modal = document.getElementById("id01");
  console.log("Modal:", modal);

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
});
