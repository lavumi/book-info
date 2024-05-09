import { requestUrl, stringifyYaml } from "obsidian";

interface getBookInfoOutput {
	ok: boolean;
	book?: bookData;
}

interface bookData {
	title: string;
	main: string;
}

interface getBookInfoInput {
	bookUrl: string;
}

const titlePipeline = (title: string) => {
	return title
		.replace(/\(.*\)/gi, "")
		.replace(/\[.*\]/gi, "")
		.replace(":", "：")
		.replace("?", "？")
		.trim();
};

// goto book info
// if book has sub title, title will be merged
// if page is not number, convert into 0
export const getBookInfoResult = async ({
	bookUrl,
}: getBookInfoInput): Promise<getBookInfoOutput> => {
	bookUrl = encodeURI(bookUrl);

	try {
		const response = await requestUrl({
			url: `http://www.yes24.com` + bookUrl,
		});

		const parser = new DOMParser();
		const html = parser.parseFromString(response.text, "text/html");
		if (html == null) {
			throw new Error();
		}

		const tags: string[] = ["📚Book"];

		html.querySelectorAll(
			"#infoset_goodsCate > div.infoSetCont_wrap > dl:nth-child(1) > dd > ul > li > a"
		).forEach((value) => {
			tags.push(value.getText().replace(/(\s*)/g, ""));
		});

		const tag = [...new Set(tags)];

		const mainTitle = html
			.querySelector(
				"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > div > h2"
			)?.getText() ?? "No title";

		const subTitle = html
			.querySelector(
				"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > div > h3"
			)
			?.getText();

		const title = subTitle
			? `${titlePipeline(mainTitle)}：${titlePipeline(subTitle)}`
			: titlePipeline(mainTitle);

		const authors: string[] = [];

		html.querySelectorAll(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_auth > a"
		).forEach((value) => {
			authors.push(value.getText().trim());
		});

		html.querySelectorAll(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_auth > span > span.moreAuthLi > span > ul > li > a"
		).forEach((value) => {
			authors.push(value.getText().trim());
		});

		const author = [...new Set(authors)];

		const publishDate = html
			.querySelector(
				"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_date"
			)
			?.getText()
			.split(" ")
			.map((v) => v.slice(0, -1))
			.join("-");

		const coverUrl =
			html
				.querySelector("#yDetailTopWrap > div.topColLft > div")
				?.querySelector(
					"#yDetailTopWrap > div.topColLft > div > div.gd_3dGrp > div > span.gd_img > em > img"
				)
				?.getAttribute("src") ||
			html
				.querySelector(
					"#yDetailTopWrap > div.topColLft > div > span > em > img"
				)
				?.getAttribute("src") ||
			"";

		const frontmatter = {
			created: `${
				new Date(+new Date() + 3240 * 10000)
					.toISOString()
					.split("T")[0] +
				" " +
				new Date().toTimeString().split(" ")[0].slice(0, 5)
			}`,
			tag: `${tag.join(" ")}`,
			title: `${title}`,
			author: `${author.join(", ")}`,
			category: `${tag[1]}`,
			publish_date: `${publishDate}`,
			cover_url: `${coverUrl}`,
		};

		const main = `---\n${stringifyYaml(frontmatter)}---\n`;

		return {
			ok: true,
			book: {
				title: title
					.replace("：", " ")
					.replace("？", "")
					.replace("/", "／")
					.replace(/\s{2,}/gi, " "),
				main,
			},
		};
	} catch (err) {
		return {
			ok: false,
		};
	}
};
