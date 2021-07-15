import matter from 'gray-matter';
import * as Log from './log';

import {
  listFilenames,
  listFilenamesOrderByModified,
  getFileRaw,
  getWorkingPath,
} from './helper';
import { Article, ArticleMeta, ItemSortType } from '../../common/types';
import markdownToHtml from 'zenn-markdown-html';
import { validateHtml } from './validator';

export function getLocalArticle(slug: string): null | Article {
  const data = readArticleFile(slug);
  if (!data) return null;
  const { meta, bodyMarkdown } = data;
  const bodyHtml = markdownToHtml(bodyMarkdown);
  const errors = validateHtml(bodyHtml);
  return {
    ...meta,
    errors,
    bodyHtml,
  };
}

export function getLocalArticleMetaList(sort?: ItemSortType): ArticleMeta[] {
  const slugs = getArticleSlugs(sort);
  const articles = slugs
    ? slugs
        .map((slug) => getArticleMetaData(slug))
        .filter((article): article is ArticleMeta => article !== null)
    : [];
  return articles;
}

function getArticleSlugs(sort?: ItemSortType): string[] {
  return getArticleFilenames(sort).map((n) => n.replace(/\.md$/, ''));
}

function getArticleFilenames(sort?: ItemSortType): string[] {
  const dirpath = getWorkingPath('articles');
  const listOrderedItems =
    sort === 'system' ? listFilenames : listFilenamesOrderByModified;
  const allFiles = listOrderedItems(dirpath);

  if (allFiles === null) {
    Log.error(
      'プロジェクトルートの articles ディレクトリを取得できませんでした。`npx zenn init`を実行して作成してください'
    );
    return [];
  }
  return allFiles ? allFiles.filter((f) => f.match(/\.md$/)) : []; // filter markdown files
}

function getArticleMetaData(slug: string): null | ArticleMeta {
  const data = readArticleFile(slug);
  return data ? data.meta : null;
}

function readArticleFile(slug: string) {
  const fullpath = getWorkingPath(`articles/${slug}.md`);
  const raw = getFileRaw(fullpath);
  if (!raw) {
    Log.error(`${fullpath}の内容を取得できませんでした`);
    return null;
  }
  const { data, content: bodyMarkdown } = matter(raw);
  return {
    meta: {
      ...data,
      slug,
    } as ArticleMeta,
    bodyMarkdown,
  };
}
