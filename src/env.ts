import dotenv from 'dotenv'

dotenv.config()

const ENV = {
    openaiApiKey: process.env.OPENAI_API_KEY as string,
    words: (process.env.WORDS_COUNT ?? 1000) as number,
    lang: (process.env.LANGUAGE ?? 'en') as string,
};
export default ENV;
