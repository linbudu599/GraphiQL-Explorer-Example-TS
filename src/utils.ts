import { FETCH_URL, FETCH_URL_LITE, FETCH_HEADERS } from "./constants";

export type ObjectRecord = {
  [key: string]: unknown
}

export type CodeMirrorMousePos = {
  line: number
  ch: number
  stick: "before" | "after"
}

export async function fetcher(params: ObjectRecord): Promise<{ data: any }> {
  const response = await fetch(
    // FETCH_URL_LITE,
    FETCH_URL,
    {
      method: "POST",
      // headers: FETCH_HEADERS,
      body: JSON.stringify(params)
    }
  );
  const responseBody = await response.text();
  // try {
  return JSON.parse(responseBody);
  // } catch (e) {
  //   return responseBody;
  // }
}
