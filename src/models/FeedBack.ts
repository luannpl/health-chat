import { Schema, Document, model, models } from "mongoose";

export interface IFeedBack extends Document {
  like: boolean;
  feedback?: string;
  createdAt: Date;
}

const FeedBackSchema = new Schema<IFeedBack>({
  like: { type: Boolean, required: true },
  feedback: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

export const FeedBack =
  models.FeedBack || model<IFeedBack>("FeedBack", FeedBackSchema);
