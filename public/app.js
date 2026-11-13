const form = document.querySelector("#contact-form");
const statusMessage = document.querySelector("#form-status");
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusMessage.textContent = "";
  statusMessage.removeAttribute("data-error");
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      body: new FormData(form)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "We couldn't send your message.");
    }

    statusMessage.textContent = result.message;
    form.reset();
  } catch (error) {
    statusMessage.textContent = error.message || "Something went wrong. Please try again.";
    statusMessage.dataset.error = "true";
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send message <span aria-hidden="true">→</span>';
  }
});
