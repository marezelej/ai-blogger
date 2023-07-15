import { Configuration, OpenAIApi } from 'openai'
import ENV from "./env";

const configuration = new Configuration({
    apiKey: ENV.openaiApiKey,
});
const openai = new OpenAIApi(configuration);
export default openai;
