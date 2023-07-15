export function toFileName(title: string): string {
    // Define a list of invalid characters for file names across different operating systems
    const invalidCharactersRegex = /[/\\?%*:|"<>.]/g;

    // Replace invalid characters with an underscore (_)
    const sanitizedTitle = title.replace(invalidCharactersRegex, '_');

    // Ensure the file name is not too long (varies across operating systems)
    const maxLength = 255; // Modify this based on the target operating system's maximum file name length

    return sanitizedTitle.slice(0, maxLength);
}
