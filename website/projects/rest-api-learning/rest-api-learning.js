const lessons = [
  {
    title: "What is a REST API?",
    duration: "3 min",
    content: `
      <p>An API is a contract that lets one piece of software ask another for data or an action. A REST-style API uses HTTP, the same request-and-response protocol behind websites, to expose resources such as books, users, or orders.</p>
      <p>Think of a library catalog: a client asks for a book at a known address, and the server replies with a result and a status code. The client and server can be built with different technologies as long as they agree on the contract.</p>
      <ul>
        <li><strong>Resource:</strong> the thing your API manages, usually named with a noun.</li>
        <li><strong>Endpoint:</strong> the URL path that identifies a resource.</li>
        <li><strong>Representation:</strong> the data sent over the wire, often JSON.</li>
      </ul>
      <p>For example, <code>/api/books</code> represents a collection of books. In the lab below, requests run against sample data in your browser rather than a real server.</p>
    `,
  },
  {
    title: "HTTP methods describe intent",
    duration: "4 min",
    content: `
      <p>The method tells the server what the client wants to do. Use nouns in paths and let the method express the action.</p>
      <ul>
        <li><code>GET /api/books</code> reads the collection. GET is safe and should not change server state.</li>
        <li><code>POST /api/books</code> creates a resource; a successful creation commonly returns <code>201 Created</code>.</li>
        <li><code>PUT /api/books/1</code> replaces a resource; <code>PATCH</code> applies a partial update.</li>
        <li><code>DELETE /api/books/1</code> removes a resource; a response may be <code>204 No Content</code>.</li>
      </ul>
      <p>PUT is idempotent: repeating the same replacement has the same intended result. POST is not generally idempotent, because repeating it may create duplicates.</p>
      <p>Try each method in the request lab. Select <code>POST</code> with <code>/api/books</code> to create a sample book, then fetch the collection.</p>
    `,
  },
  {
    title: "Status codes tell you what happened",
    duration: "3 min",
    content: `
      <p>Every HTTP response carries a status code. The first digit gives you a quick category:</p>
      <ul>
        <li><strong>2xx — success:</strong> <code>200 OK</code>, <code>201 Created</code>, <code>204 No Content</code>.</li>
        <li><strong>4xx — request issue:</strong> <code>400 Bad Request</code>, <code>401 Unauthorized</code>, <code>404 Not Found</code>.</li>
        <li><strong>5xx — server issue:</strong> <code>500 Internal Server Error</code>.</li>
      </ul>
      <p>A status code is part of the API contract, not just a message for a person. Clients can use it to decide whether to show data, ask for corrected input, or retry later.</p>
      <p>In the lab, request <code>GET /api/books/999</code> to see a <code>404</code>. Then try sending invalid JSON to see a <code>400</code>.</p>
    `,
  },
  {
    title: "JSON is the message body",
    duration: "3 min",
    content: `
      <p>JSON is a text format for structured data. Objects have named properties, arrays hold ordered lists, and strings must use double quotes.</p>
      <pre><code>{
  "id": 1,
  "title": "Clean Code",
  "author": "Robert C. Martin"
}</code></pre>
      <p>Requests that send JSON usually include the header <code>Content-Type: application/json</code>. A client can request a response format with <code>Accept: application/json</code>.</p>
      <p>Keep the shape of your JSON consistent and document which fields are required. The lab validates that new or updated books include both a title and an author.</p>
    `,
  },
  {
    title: "Build an endpoint with Java",
    duration: "5 min",
    content: `
      <p>Spring Web lets a Java class map HTTP requests to methods. An annotated controller can accept a JSON request body and return a Java object that Spring serializes as JSON.</p>
      <pre><code>@RestController
@RequestMapping("/api/books")
class BookController {
    @GetMapping("/{id}")
    Book findById(@PathVariable long id) {
        return bookService.findById(id);
    }

    @PostMapping
    ResponseEntity&lt;Book&gt; create(@RequestBody NewBook input) {
        Book book = bookService.create(input);
        return ResponseEntity.created(
            URI.create("/api/books/" + book.id())
        ).body(book);
    }
}</code></pre>
      <p><code>@RestController</code> makes returned objects response bodies, <code>@GetMapping</code> and <code>@PostMapping</code> route methods, and <code>@RequestBody</code> asks Spring to deserialize JSON. Keep business rules in a service, validate input, and return meaningful status codes.</p>
    `,
  },
];

const lessonNav = document.querySelector("#lesson-nav");
const lessonNumber = document.querySelector("#lesson-number");
const lessonDuration = document.querySelector("#lesson-duration");
const lessonTitle = document.querySelector("#lesson-title");
const lessonContent = document.querySelector("#lesson-content");
const previousLessonButton = document.querySelector("#previous-lesson");
const completeLessonButton = document.querySelector("#complete-lesson");
const progressCount = document.querySelector("#progress-count");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const requestMethod = document.querySelector("#request-method");
const requestPath = document.querySelector("#request-path");
const requestBody = document.querySelector("#request-body");
const sendRequestButton = document.querySelector("#send-request");
const resetApiButton = document.querySelector("#reset-api");
const responseStatus = document.querySelector("#response-status");
const responseMeta = document.querySelector("#response-meta");
const responseBody = document.querySelector("#response-body");
const quizOptions = document.querySelectorAll(".rest-quiz-option");
const quizFeedback = document.querySelector("#quiz-feedback");

let activeLesson = 0;
const completedLessons = new Set();
const initialBooks = [
  { id: 1, title: "Clean Code", author: "Robert C. Martin" },
  { id: 2, title: "The Pragmatic Programmer", author: "David Thomas and Andrew Hunt" },
];
let books = initialBooks.map((book) => ({ ...book }));

function renderProgress() {
  const count = completedLessons.size;
  progressCount.textContent = `${count} of ${lessons.length} lessons complete`;
  progressTrack.setAttribute("aria-valuenow", String(count));
  progressFill.style.width = `${(count / lessons.length) * 100}%`;
}

function renderLesson() {
  const lesson = lessons[activeLesson];
  lessonNumber.textContent = `LESSON ${String(activeLesson + 1).padStart(2, "0")}`;
  lessonDuration.textContent = lesson.duration;
  lessonTitle.textContent = lesson.title;
  lessonContent.innerHTML = lesson.content;
  previousLessonButton.disabled = activeLesson === 0;
  completeLessonButton.textContent = completedLessons.has(activeLesson)
    ? activeLesson === lessons.length - 1 ? "Lesson complete" : "Continue learning"
    : activeLesson === lessons.length - 1 ? "Mark lesson complete" : "Mark complete & continue";

  Array.from(lessonNav.children).forEach((button, index) => {
    if (index === activeLesson) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
    button.querySelector(".rest-lesson-check").textContent =
      completedLessons.has(index) ? "✓" : "";
  });
}

lessons.forEach((lesson, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", `Lesson ${index + 1}: ${lesson.title}`);

  const number = document.createElement("span");
  number.className = "rest-lesson-index";
  number.textContent = String(index + 1).padStart(2, "0");

  const title = document.createElement("span");
  title.textContent = lesson.title;

  const check = document.createElement("span");
  check.className = "rest-lesson-check";
  check.setAttribute("aria-hidden", "true");
  button.append(number, title, check);
  button.addEventListener("click", () => {
    activeLesson = index;
    renderLesson();
  });
  lessonNav.append(button);
});

previousLessonButton.addEventListener("click", () => {
  if (activeLesson > 0) {
    activeLesson -= 1;
    renderLesson();
  }
});

completeLessonButton.addEventListener("click", () => {
  completedLessons.add(activeLesson);
  if (activeLesson < lessons.length - 1) {
    activeLesson += 1;
  }
  renderProgress();
  renderLesson();
});

function makeResponse(status, statusText, body, headers = {}) {
  return { status, statusText, body, headers };
}

function parseRequestBody() {
  try {
    const body = JSON.parse(requestBody.value);
    if (!body || Array.isArray(body) || typeof body !== "object") {
      return { error: "The JSON body must be an object." };
    }
    return { body };
  } catch {
    return { error: "The request body is not valid JSON." };
  }
}

function validBook(book) {
  return typeof book.title === "string" && book.title.trim().length > 0 &&
    typeof book.author === "string" && book.author.trim().length > 0;
}

function simulateRequest() {
  const method = requestMethod.value;
  const path = requestPath.value.trim().replace(/\/+$/, "") || "/";
  const match = path.match(/^\/api\/books(?:\/(\d+))?$/);

  if (!match) {
    return makeResponse(404, "Not Found", { message: "No route matches this path." });
  }

  const id = match[1] ? Number(match[1]) : null;
  const bookIndex = id === null ? -1 : books.findIndex((book) => book.id === id);

  if (method === "GET") {
    if (id === null) {
      return makeResponse(200, "OK", books);
    }
    return bookIndex < 0
      ? makeResponse(404, "Not Found", { message: `Book ${id} was not found.` })
      : makeResponse(200, "OK", books[bookIndex]);
  }

  if (method === "POST") {
    if (id !== null) {
      return makeResponse(405, "Method Not Allowed", { message: "POST creates books at /api/books." });
    }
    const parsed = parseRequestBody();
    if (parsed.error) {
      return makeResponse(400, "Bad Request", { message: parsed.error });
    }
    if (!validBook(parsed.body)) {
      return makeResponse(400, "Bad Request", { message: "A non-empty title and author are required." });
    }
    const newId = Math.max(0, ...books.map((book) => book.id)) + 1;
    const created = { id: newId, title: parsed.body.title.trim(), author: parsed.body.author.trim() };
    books.push(created);
    return makeResponse(201, "Created", created, { Location: `/api/books/${newId}` });
  }

  if (id === null) {
    return makeResponse(405, "Method Not Allowed", { message: `${method} requires a book ID in the path.` });
  }
  if (bookIndex < 0) {
    return makeResponse(404, "Not Found", { message: `Book ${id} was not found.` });
  }

  if (method === "DELETE") {
    books.splice(bookIndex, 1);
    return makeResponse(204, "No Content", null);
  }

  if (method === "PUT" || method === "PATCH") {
    const parsed = parseRequestBody();
    if (parsed.error) {
      return makeResponse(400, "Bad Request", { message: parsed.error });
    }
    const updated = method === "PUT"
      ? { id, title: parsed.body.title, author: parsed.body.author }
      : { ...books[bookIndex], ...parsed.body, id };
    if (!validBook(updated)) {
      return makeResponse(400, "Bad Request", { message: "A non-empty title and author are required." });
    }
    books[bookIndex] = { id, title: updated.title.trim(), author: updated.author.trim() };
    return makeResponse(200, "OK", books[bookIndex]);
  }

  return makeResponse(405, "Method Not Allowed", { message: "That HTTP method is not supported by this lab." });
}

function displayResponse(response) {
  responseStatus.textContent = `${response.status} ${response.statusText}`;
  responseStatus.dataset.state = response.status >= 200 && response.status < 300
    ? "success"
    : "error";
  responseMeta.textContent = `HTTP/1.1 ${response.status} ${response.statusText}${
    response.headers.Location ? ` · Location: ${response.headers.Location}` : ""
  }`;
  responseBody.querySelector("code").textContent = response.body === null
    ? "(empty response body)"
    : JSON.stringify(response.body, null, 2);
}

sendRequestButton.addEventListener("click", () => {
  displayResponse(simulateRequest());
});

resetApiButton.addEventListener("click", () => {
  books = initialBooks.map((book) => ({ ...book }));
  requestMethod.value = "GET";
  requestPath.value = "/api/books";
  displayResponse(makeResponse(200, "OK", books));
});

quizOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const correct = option.dataset.answer === "GET";
    quizOptions.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice === option));
    });
    quizFeedback.dataset.state = correct ? "correct" : "incorrect";
    quizFeedback.textContent = correct
      ? "Correct! GET retrieves a resource and should not change server state."
      : "Not quite. Think of the method used to read data without changing it.";
  });
});

renderProgress();
renderLesson();
