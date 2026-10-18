import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class AiTransport {
  async generate(input: any) {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
      timeout: 45000,
    }).responses.parse(input);
  }
}
