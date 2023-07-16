import fs from 'fs';
import openai from "./openapi";
import {toFileName} from "./functions";
import ENV from "./env";
import ArrayBufferView = NodeJS.ArrayBufferView;

async function fetchTrend(): Promise<string> {
    const startYear = 1800;
    const endYear = 2020;

    const startTime = new Date(`${startYear}-01-01`).getTime();
    const endTime = new Date(`${endYear + 1}-01-01`).getTime() - 1;

    const randomTimestamp = Math.random() * (endTime - startTime) + startTime;
    const date = new Date(randomTimestamp);

    const dateString = date.toISOString().substring(0, 7);
    return `a historical fact in ${dateString}`;
}

async function generateContent(topic: string, words: number, lang: string): Promise<{ title: string; content: string, prompt: string }> {
    let prompt = `Write an article about ${topic}`;
    prompt += 'Use markdown.';
    prompt += 'Include images with long descriptions and without url.';
    prompt += `Limit to ${words} words.`;
    prompt += `Lang: ${lang}.`;
    const response = await openai.createChatCompletion({
        messages: [{role: 'user', content: prompt}],
        model: 'gpt-3.5-turbo',
        n: 1,
    });

    const generatedText = response.data.choices[0]?.message?.content
    if (!generatedText) {
        throw new Error('Completion response did not contain any content.');
    }
    const [title] = generatedText.split('\n');

    return {
        title: title.replace(/[#*]/g, '').trim(),
        content: generatedText,
        prompt
    };
}

function saveArticle(title: string, content: string): string {
    const timestamp = Date.now();
    const filePath = `./ai-blogger-server/src/content/articles/` + toFileName(`${timestamp} - ${title}`) + '.md';
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}

function getPrompt(content: string, image: string): string {
    const startIndex = content.indexOf(image) + image.length + 1;
    const newLineIndex = content.indexOf('\n', startIndex);
    return image + ' - ' + content.substring(startIndex, newLineIndex);
}

async function generateImage(path: string, prompt: string) {
    const response = await openai.createImage({
        prompt,
        n: 1,
        size: '256x256',
    });
    const imageResponse = await fetch(response.data.data[0].url ?? '');
    const blob = await imageResponse.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(path, buffer);
}

async function replaceImages(content: string): Promise<{
    content: string,
    images: {label: string, url: string}[]
}> {
    const regex = /!\[([^\]]*)]\((.*?)\)/g;
    const matches = content.matchAll(regex) || [];
    let images = [];
    let newContent = content;
    for (const match of matches) {
        const description = match[1].trim();
        const prompt = getPrompt(content, match[0]);
        const fileName = Date.now() + '.png';
        const path = `./ai-blogger-server/public/img/${fileName}`;
        const url = `/img/${fileName}`;
        await generateImage(path, prompt);
        images.push({
            label: description,
            url: url
        });
        newContent = newContent.replace(match[0], `![${description}](${url})\n`);
    }
    return {
        content: newContent,
        images: []
    };
}

async function createArticle(): Promise<{title: string, content: string, prompt: string, file: string}> {
    const trend = await fetchTrend();
    const { title, content: markdown, prompt } = await generateContent(trend, ENV.words, ENV.lang);
    const { content } = await replaceImages(markdown);
    const file = saveArticle(title, content);
    return {
        title,
        content,
        prompt,
        file
    };
}

console.log('Creating a new article...');

createArticle()
    .then(({file}) => {
        console.log(`Successfully created the '${file}' article.`);
    }).catch(e => {
        console.log('There was an error creating the article.');
        console.log(`${e.message}`);
    });
