import { Schema, Document, model, models } from "mongoose";

export interface IFeedBack extends Document {
  feedback?: string;
  createdAt: Date;
  rate: number;
}

const FeedBackSchema = new Schema<IFeedBack>({
  feedback: { type: String, required: false },
  rate: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FeedBack =
  models.FeedBack || model<IFeedBack>("FeedBack", FeedBackSchema);
