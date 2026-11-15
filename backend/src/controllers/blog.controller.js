import BlogPost from "../models/BlogPost.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { commitContent } from "../services/indexnow.js";
import { audit } from "../services/audit.js";
import { httpError, isId, pageParams, pagination, safeUrl, str, strList, toSlug } from "../utils/validate.js";

export const listPosts = asyncHandler(async (req, res) => {
  const filter = req.admin ? {} : { published: true };
  if (req.query.category) filter.relatedCategories = String(req.query.category);
  const { page, limit, skip } = pageParams(req.query, 12, 50);
  const [posts, total] = await Promise.all([
    BlogPost.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).select("-content").lean(),
    BlogPost.countDocuments(filter),
  ]);
  res.json({ posts, pagination: pagination(page, limit, total) });
});

export const getPost = asyncHandler(async (req, res) => {
  const filter = { slug: String(req.params.slug) };
  if (!req.admin) filter.published = true;
  const post = await BlogPost.findOne(filter).lean();
  if (!post) throw httpError(404, "Article not found");
  const related = await BlogPost.find({ _id: { $ne: post._id }, published: true, $or: [{ category: post.category }, { tags: { $in: post.tags } }] })
    .select("title slug excerpt category readingMinutes publishedAt").sort({ publishedAt: -1 }).limit(3).lean();
  res.json({ post, related });
});

function sanitize(body) {
  const out = {};
  if (body.title !== undefined) out.title = str(body.title, 200);
  if (body.excerpt !== undefined) out.excerpt = str(body.excerpt, 600);
  if (body.content !== undefined) out.content = str(body.content, 60000);
  if (body.author !== undefined) out.author = str(body.author, 120) || "OSAKA TOOL Engineering Desk";
  if (body.category !== undefined) out.category = str(body.category, 60) || "Guides";
  if (body.tags !== undefined) out.tags = strList(body.tags, 20, 40);
  if (body.relatedCategories !== undefined) out.relatedCategories = strList(body.relatedCategories, 10, 120);
  if (body.coverImage !== undefined) out.coverImage = { url: safeUrl(body.coverImage?.url), publicId: str(body.coverImage?.publicId, 200) };
  if (body.seo !== undefined) out.seo = { title: str(body.seo?.title, 120), description: str(body.seo?.description, 320) };
  if (body.published !== undefined) out.published = Boolean(body.published);
  if (out.content !== undefined) out.readingMinutes = Math.max(1, Math.round(out.content.split(/\s+/).length / 220));
  return out;
}

const paths = (post) => ["/resources", `/resources/${post.slug}`];

export const createPost = asyncHandler(async (req, res) => {
  const data = sanitize(req.body);
  if (!data.title) throw httpError(400, "Title is required");
  let slug = toSlug(req.body.slug || data.title);
  if (await BlogPost.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;
  const post = new BlogPost({ ...data, slug, publishedAt: new Date() });
  await commitContent(post.published ? paths(post) : [], (session) => post.save({ session }));
  await audit(req, "create", "article", post._id, `Created article ${post.title}`);
  res.status(201).json({ post });
});

export const updatePost = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw httpError(404, "Article not found");
  const wasPublished = post.published;
  Object.assign(post, sanitize(req.body)); // the slug is preserved when the title changes
  await commitContent(wasPublished || post.published ? paths(post) : [], (session) => post.save({ session }));
  await audit(req, "update", "article", post._id, `Updated article ${post.title}`);
  res.json({ post });
});

export const deletePost = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw httpError(404, "Article not found");
  await commitContent(post.published ? paths(post) : [], (session) => post.deleteOne({ session }));
  await audit(req, "delete", "article", post._id, `Deleted article ${post.title}`);
  res.json({ message: "Article deleted" });
});
