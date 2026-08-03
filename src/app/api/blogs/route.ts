import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { hasOnlyKeys, readStrictJson } from '@/lib/security';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSessionUser(cookieStore);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, userId } = session;

    let blogs;

    if (role === 'CEO' || role === 'ADMIN' || role === 'DIRECTOR') {
      blogs = await db.blogPost.findMany({
        where: { deletedAt: null },
        include: {
          author: {
            select: { name: true, role: true, department: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      blogs = await db.blogPost.findMany({
        where: { authorId: userId, deletedAt: null },
        include: {
          author: {
            select: { name: true, role: true, department: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, blogs });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching blogs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSessionUser(cookieStore);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role } = session;

    if (!['CEO', 'ADMIN', 'DIRECTOR', 'HEAD'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await readStrictJson(request, 120_000);
    if (!body || !hasOnlyKeys(body, ['title', 'slug', 'excerpt', 'content', 'tags', 'metaDescription', 'canonicalUrl', 'focusKeyphrase', 'coverImage'])) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    const { title, slug, excerpt, content, tags, metaDescription, canonicalUrl, focusKeyphrase, coverImage } = body;

    if (typeof title !== 'string' || typeof slug !== 'string' || typeof content !== 'string' || title.length > 200 || slug.length > 160 || content.length > 100_000 || !title.trim() || !slug.trim() || !content.trim() || !Array.isArray(tags) || tags.length > 20 || !tags.every((tag) => typeof tag === 'string' && tag.length <= 50)) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A blog with this slug already exists' },
        { status: 400 }
      );
    }

    const newBlog = await db.blogPost.create({
      data: {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: typeof excerpt === 'string' ? excerpt.slice(0, 500) : null,
        content,
        tags,
        metaDescription: typeof metaDescription === 'string' ? metaDescription.slice(0, 320) : null,
        canonicalUrl: typeof canonicalUrl === 'string' && /^https:\/\//.test(canonicalUrl) ? canonicalUrl.slice(0, 2000) : null,
        focusKeyphrase: typeof focusKeyphrase === 'string' ? focusKeyphrase.slice(0, 200) : null,
        coverImage: typeof coverImage === 'string' && /^https:\/\//.test(coverImage) ? coverImage.slice(0, 2000) : null,
        authorId: userId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Blog submitted successfully and is pending approval.',
      blog: newBlog,
    });
  } catch (error: any) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the blog' },
      { status: 500 }
    );
  }
}
