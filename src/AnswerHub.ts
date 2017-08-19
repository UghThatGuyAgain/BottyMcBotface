import request = require("request");
import toMarkdown = require("to-markdown");

export default class AnswerHubAPI {
    /** The base AnswerHub URL (with a trailing slash) */
    public readonly baseURL: string;
    /** The value of the "Authorization" header to be included with all AnswerHubAPI requests */
    private readonly auth: string;

    public constructor(url: string, username: string, password: string) {
        // Add a trailing / if missing
        this.baseURL = url.substr(url.length - 1) === "/" ? url : url + "/";

        this.auth = `Basic ${new Buffer(username + ":" + password, "binary").toString("base64")}`;
    }
    
    /**
     * Makes a request to the AnswerHub AnswerHubAPI
     * @param url The url to make a request to, relative to the base AnswerHubAPI url
     * @async
     * @throws {any} Thrown if an error is received from the AnswerHubAPI
     * @returns The parsed body of the response from the AnswerHubAPI
     */
    private makeRequest<T>(url: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const options = {
                followAllRedirects: true,
                url: `${this.baseURL}services/v2/${url}`,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: this.auth
                }
            };

            request.post(options, (error, response) => {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject(`Received status code ${response.statusCode}`);
                } else {
                    try {
                        const body = JSON.parse(response.body);
                        resolve(body);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        });
    }

    public static formatQuestionBody(body: string): string {
        const markdown = toMarkdown(body, { gfm: true });
        const clamped = markdown.substr(0, Math.min(1021, markdown.length));
        // TODO handle relative links
        // TODO handle code blocks
        return clamped + (clamped.length === 1021 ? "..." : "");
    }

    getQuestions(page = 1, sort = "active"): Promise<NodeList<Question>> {
        return this.makeRequest(`question.json?page=${page}&sort=${sort}`);
    }

    getAnswers(page = 1, sort = "active"): Promise<NodeList<Answer>> {
        return this.makeRequest(`answer.json?page=${page}&sort=${sort}`);
    }

    getComments(page = 1, sort = "active"): Promise<NodeList<Comment>> {
        return this.makeRequest(`comment.json?page=${page}&sort=${sort}`);
    }

    getQuestion(id: number): Promise<Question> {
        return this.makeRequest(`question/${id}.json`);
    }

    getArticle(id: number): Promise<Article> {
        return this.makeRequest(`article/${id}.json`);
    }

    getAnswer(id: number): Promise<Answer> {
        return this.makeRequest(`answer/${id}.json`);
    }

    getComment(id: number): Promise<Comment> {
        return this.makeRequest(`comment/${id}.json`);
    }
}

// TODO document more fields that this contains (that aren't being used)?
/**
 * A comment, question, or answer
 * @see http://api.dzonesoftware.com/v2/reference#section-node-data-models
 */
export interface Node {
    id: number;
    type: "question" | "comment" | "answer";
    /** The time when this node was created (in epoch milliseconds) */
    creationDate: number;
    title: string;
    body: string;
    bodyAsHTML: string;
    author: {
        id: number;
        username: string;
    };
    activeRevisionId: number;
    parentId: number;
    originalParentId: number;
    slug: string;
}

export interface Question extends Node {}

export interface Answer extends Node {}

export interface Comment extends Node {}

export interface Article extends Node {}

export interface NodeList<T extends Node> {
    list: T[];
}
