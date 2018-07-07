const ut = require('../js/utils.js');
const er = require('../js/entryrender.js');

UtilBookReference = {
	getSections (refId) {
		switch (refId) {
			case "bookref-quick":
				return [
					"Character Creation",
					"Equipment",
					"Playing the Game",
					"Combat",
					"Adventuring"
				];
			case "bookref-dmscreen":
				return [
					"Running the Game",
					"Combat",
					"Factions"
				];
			default:
				throw new Error(`No sections defined for book id ${refId}`);
		}
	},

	getIndex (...refTypes) {
		const index = require(`../data/books.json`);
		const books = {};
		index.book.forEach(b => {
			books[b.id.toLowerCase()] = require(`../data/book/book-${b.id.toLowerCase()}.json`);
		});

		const outJson = {
			reference: {},
			data: {}
		};

		refTypes.forEach(it => outJson.reference[it.id] = {
			name: it.name,
			id: it.id,
			contents: []
		});

		let bookData = [];
		function reset () {
			bookData = [];
			index.book.forEach(b => {
				const data = JSON.parse(JSON.stringify(books[b.id.toLowerCase()]));
				bookData.push(data);
			});
		}

		refTypes.forEach(refType => {
			reset();
			const out = {};

			function isDesiredSect (ent) {
				return ent.entries && ent.data && ent.data[refType.tag];
			}

			function recursiveAdd (ent) {
				if (isDesiredSect(ent)) {
					const sect = ent.data[refType.tag];
					if (!out[sect]) {
						out[sect] = {
							sectName: UtilBookReference.getSections(refType.id)[sect - 1],
							sections: []
						};
					}

					const toAdd = JSON.parse(JSON.stringify(ent));
					toAdd.type = "section";

					// remove any children which are themselves tagged sections
					const removeIndices = [];
					if (toAdd.entries) {
						toAdd.entries.forEach((nxt, i) => {
							if (isDesiredSect(nxt)) {
								removeIndices.push(i);
								recursiveAdd(nxt)
							}
						})
					}

					if (removeIndices.length) {
						toAdd.entries = toAdd.entries.filter((it, i) => {
							return !removeIndices.includes(i)
						});
					}
					delete toAdd.data;

					out[sect].sections.push(toAdd)
				} else if (ent.entries) {
					ent.entries.forEach(nxt => recursiveAdd(nxt));
				}
			}

			bookData.forEach(book => {
				book.data.forEach(chap => {
					if (chap.entries) {
						recursiveAdd(chap);
					}
				})
			});

			Object.keys(out).sort().forEach(i => {
				const sects = out[i].sections.sort((a, b) => SortUtil.ascSort(a.name, b.name));
				const header = outJson.reference[refType.id];
				header.contents.push({
					name: out[i].sectName,
					headers: sects.map(s => s.name)
				});
				const toAdd = {
					type: "entries",
					entries: sects
				};
				if (!outJson.data[refType.id]) outJson.data[refType.id] = [];
				outJson.data[refType.id].push(toAdd);
			});
		});

		return outJson;
	}
};

module.exports.UtilBookReference = UtilBookReference;
