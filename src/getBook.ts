import { getBookInfoResult } from "./getBookInfo";
import { getBookUrl } from "./searchUrl";

interface getBookOutput {
	ok: boolean;
	book?: bookData;
	error?: string;
}

interface bookData {
	title: string;
	main: string;
}

// get book's info and return frontmatter
export const getBook = async (bookTitle:string): Promise<getBookOutput> => {
	const bookUrlResult = await getBookUrl(bookTitle);

	if (!bookUrlResult.ok) {
		return { ok: false, error: `${bookTitle} url not found` };
	}

	const bookInfoResult = await getBookInfoResult({
		bookUrl: bookUrlResult.url ?? "",
	});

	if (!bookInfoResult.ok) {
		return { ok: false, error: "Get book info error occured" };
	}

	return { ok: true, book: bookInfoResult.book };
};
