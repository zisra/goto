document.onerorr = (a, b, c) => {
	console.error(a);
};

let bookmarks = [
	{
		name: "google",
		url: "https://google.com",
	},
	{
		name: "youtube",
		url: "https://youtube.com",
	},
	{
		name: "time",
		url: () => {
			return new Date().toLocaleTimeString();
		},
	},
	{
		name: "funfact",
		url: async () => {
			const data = await fetch(
				"https://uselessfacts.jsph.pl/random.json?language=en"
			);
			const res = await data.json();
			return res.text;
		},
	},
	{
		name: "meme",
		url: async () => {
			const data = await fetch("https://meme-api.herokuapp.com/gimme");
			const res = await data.json();
			return `<img src="${res.preview[res.preview.length - 1]
				}" class="img-fluid">`;
		},
	},
];
const alertBox = {
	info: (text) => {
		document.getElementById(
			"alert-space"
		).innerHTML = `<div class="alert text-wrap alert-light alert-dismissible fade show" role="alert">
  ${text}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`;
	},
	error: (text) => {
		document.getElementById(
			"alert-space"
		).innerHTML = `<div class="alert text-wrap alert-danger alert-dismissible fade show" role="alert">
  ${text}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`;
	},
	success: (text) => {
		document.getElementById(
			"alert-space"
		).innerHTML = `<div class="alert text-wrap alert-success alert-dismissible fade show" role="alert">
  ${text}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`;
	}
};

const updateModal = () => {
	let links = bookmarks
		.map((i) => {
			if (i.url instanceof Function) {
				let links = bookmarks.map((i) => `<a href="${i.url}">${i.name}</a>`);
				return `<a onclick="run('${i.name}')">${i.name}</a>`;
			} else {
				return `<a ${i.extra ? 'class="extra"' : ""} href="${i.url}">${i.name
					}</a>`;
			}
		})
		.sort()
		.join("<br />");
	document.getElementById(
		"modal-space"
	).innerHTML = `<div class="modal modal-dialog-scrollable fade show" id="modal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Bookmarks</h5>
      </div>
      <div class="modal-body" id="modal-body">
        <p>${links}</p>
        <h5 class="modal-title">Extras</h5>
        <ul>
      <li>Go to a subreddit by typing <kbd>r/subreddit</kbd></li>
      <li>Get a random image from any subreddit by typing <kbd>r!subreddit</kbd></li>
      <li>Add a custom bookmark: <kbd>!add name url</kbd></li>
      <li>Remove a custom bookmark: <kbd>!remove name</kbd></li>
      <li>Export custom bookmarks: <kbd>!export</kbd></li>
      <li>Load custom bookmarks: <kbd>!load data</kbd></li>
<li>Evaluate JavaScript with <kbd> js:codeGoesHere()</kbd></li
</ul>
      </div>
<div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>`;
};

const updateBookmarks = (extra) => {
	extra.forEach((i) => {
		i.extra = true;
	});
	try {
		bookmarks = [...bookmarks, ...extra];
	} catch (err) {
		console.log(err);
	}
	updateModal();
};

if (localStorage.extraBookmarks) {
	updateBookmarks(JSON.parse(localStorage.extraBookmarks));
}

const input = document.getElementById("autoComplete");
let button = document.getElementById("btn");
function focusInput(selectedBookmark) {
	input.value = selectedBookmark;
	input.focus();
	input.select();
	autoCompleteJS.close();
}

const run = (selectedBookmark) => {
	bootstrap.Modal.getInstance(document.getElementById("modal")).hide();

	let bookmark = bookmarks.find((i) => i.name === selectedBookmark);
	if (bookmark.url.constructor.name === "AsyncFunction") {
		alertBox.info("<b>Loading...</b>");
		focusInput(selectedBookmark);

		bookmark
			.url()
			.then((i) => {
				alertBox.info(i);
				focusInput(selectedBookmark);
			})
			.catch((i) => {
				alertBox.error(i);
				focusInput(selectedBookmark);
			});
	} else {
		alertBox.info(bookmark.url());
		focusInput(selectedBookmark);
	}
}

const autoCompleteJS = new autoComplete({
	placeHolder: "Search",
	data: {
		src: async (query) => {
			if (query.startsWith("r/")) {
				const source = await fetch(
					"https://api.allorigins.win/get?url=" +
					encodeURIComponent(
						`https://www.reddit.com/api/subreddit_autocomplete_v2.json?query=${query.replace(
							"r/",
							""
						)}`
					)
				);
				const data = await source.json();
				const res = JSON.parse(data.contents);
				return res.data.children.map((i) => i.data.display_name_prefixed);
			} else {
				const source = await fetch(
					"https://api.allorigins.win/get?url=" +
					encodeURIComponent(
						`https://suggestqueries.google.com/complete/search?client=firefox&q=${query}`
					)
				);
				const data = await source.json();
				const res = JSON.parse(data.contents);
				if (bookmarks.some((i) => i.name === query) || query === "help") {
					return [query, ...res[1]];
				} else {
					return res[1];
				}
			}
		},
	},
	resultItem: {
		highlight: {
			render: true,
		},
	},
	resultsList: {
		maxResults: 5,
	},
	events: {
		input: {
			focus() {
				const inputValue = autoCompleteJS.input.value;
				if (inputValue.length) autoCompleteJS.start();
			},
		},
	},
});

window.onload = () => {
	input.focus();
	updateModal();
};

input.addEventListener("keyup", function(event) {
	if (event.keyCode === 13) {
		event.preventDefault();
		button.click();
	}
});
input.addEventListener("selection", function(event) {
	if (event.detail.selection.value.startsWith("r/")) {
		document.location.href =
			"https://reddit.com/r/" + event.detail.selection.value.replace("r/", "");
	} else {
		document.location.href =
			"https://google.com/search?q=" +
			encodeURIComponent(event.detail.selection.value);
	}
});

input.addEventListener("navigate", function(event) {
	input.value = event.detail.selection.value;
});

button.addEventListener("click", async (event) => {
	const data = input.value;
	const args = data.split(" ");
	const bookmark = bookmarks.find((i) => i.name === data);
	if (data === bookmark?.name) {
		if (bookmark.url instanceof Function) {
			input.select();
			if (bookmark.url.constructor.name === "AsyncFunction") {
				alertBox.info("<b>Loading...</b>");
				autoCompleteJS.close();
				bookmark
					.url()
					.then((i) => {
						alertBox.info(i);
					})
					.catch((i) => {
						alertBox.error(i);
					});
			} else {
				alertBox.info(bookmark.url());
				autoCompleteJS.close();
			}
		} else {
			document.location.href = bookmark.url;
		}
	} else if (data.startsWith("!add")) {
		if (
			args[1] &&
			(args[2]?.startsWith("https://") ||
				args[2]?.startsWith("http://") ||
				args[2]?.startsWith("//"))
		) {
			if (!localStorage.extraBookmarks) {
				localStorage.extraBookmarks = JSON.stringify([]);
				updateBookmarks([]);
			}
			const newBookmarks = JSON.parse(localStorage.extraBookmarks);
			if (
				newBookmarks.some((i) => i.name === args[1])
			) {
				newBookmarks.splice(
					newBookmarks.findIndex((i) => i.name === args[1]),
					1
				);
				newBookmarks.push({
					name: args[1],
					url: args[2],
				});
				localStorage.extraBookmarks = JSON.stringify(newBookmarks);
				updateBookmarks(JSON.parse(localStorage.extraBookmarks));
				alertBox.success(
					`${args[1]} updated to the URL <a href="${args[2]}">${args[2]}</a>`
				);
			} else {
				newBookmarks.push({
					name: args[1],
					url: args[2],
				});
				localStorage.extraBookmarks = JSON.stringify(newBookmarks);
				updateBookmarks(JSON.parse(localStorage.extraBookmarks));
				alertBox.success(
					`${args[1]} added with the URL <a href="${args[2]}">${args[2]}</a>`
				);
			}

		} else {
			alertBox.error("Invalid URL");
		}

	} else if (data.startsWith("!remove")) {
		if (!localStorage.extraBookmarks) {
			localStorage.extraBookmarks = JSON.stringify([]);
			updateBookmarks([]);
		}
		const newBookmarks = JSON.parse(localStorage.extraBookmarks);
		if (newBookmarks.some((i) => i.name === args[1])) {

			newBookmarks.splice(
				newBookmarks.findIndex((i) => i.name === args[1]),
				1
			);
			localStorage.extraBookmarks = JSON.stringify(newBookmarks);
			updateBookmarks(JSON.parse(localStorage.extraBookmarks));
			alertBox.success(`Removed ${args[1]}`);
		} else {
			alertBox.success(`Bookmark ${args[1]} does not exist`);
		}
	} else if (data.startsWith("!load")) {
		if (args[1]) {
			localStorage.extraBookmarks = atob(args[1]);
			updateBookmarks(JSON.parse(localStorage.extraBookmarks));
		} else {
			localStorage.extraBookmarks = JSON.stringify([]);
			updateBookmarks([]);
		}
	} else if (data.startsWith("!export")) {
		if (!localStorage.extraBookmarks) {
			localStorage.extraBookmarks = JSON.stringify([]);
			updateBookmarks([]);
		}
		if (localStorage.extraBookmarks === '[]') {
			alertBox.error('There are no bookmarks to export');

		} else {
			alertBox.info(`!load ${btoa(localStorage.extraBookmarks)}`);
		}
	} else if (data.startsWith("js:")) {
		try {
			const evalResult = eval(data.replace("js:", ""));
			if (evalResult) {
				if (typeof evalResult === "object") {
					alertBox.info(JSONTree.create(evalResult));
				} else {
					alertBox.info(`${evalResult.toString().replace("\n", "<br />")}`);
				}
			}
		} catch (err) {
			alertBox.error(err);
		}
	} else if (data.startsWith("r!")) {
		input.select();
		const req = await fetch(
			`https://meme-api.herokuapp.com/gimme/${data.replace("r!", "")}`
		);
		const res = await req.json();
		alertBox.info(
			`<img src="${res.preview[res.preview.length - 1]}" class="img-fluid">`
		);
	} else if (data === "help") {
		const modal = new bootstrap.Modal(document.getElementById("modal"));

		modal.show();
	} else if (
		data.startsWith("http://") ||
		data.startsWith("https://") ||
		data.startsWith("//")
	) {
		document.location.href = data;
	} else if (data.startsWith("r/")) {
		document.location.href = "https://reddit.com/r/" + data.replace("r/", "");
	} else {
		document.location.href =
			"https://google.com/search?q=" + encodeURIComponent(data);
	}
});
