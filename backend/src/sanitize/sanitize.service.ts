import { Injectable } from "@nestjs/common";
import sanitizeHtml from "sanitize-html";

@Injectable()
export class SanitizeService {
    private readonly defaultAllowedTags = [
        'b','i','em','strong','a'
    ];

    private readonly allowedAllowedAttributes = {
        a: ['href'],
    };

    sanitizeInput(input: any): any{
        const sanitized = sanitizeHtml(input, {
            allowedTags: this.defaultAllowedTags,
            allowedAttributes: this.allowedAllowedAttributes,
        });
        return sanitized;
    }
}