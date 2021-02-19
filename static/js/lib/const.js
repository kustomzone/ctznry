import { parseUserId, joinPath } from './strings.js'

export const DEBUG_ENDPOINTS = {
  'dev1.localhost': 'localhost:15001',
  'dev2.localhost': 'localhost:15002',
  'dev3.localhost': 'localhost:15003',
  'dev4.localhost': 'localhost:15004'
}

export function HTTP_ENDPOINT (domain) {
  return DEBUG_ENDPOINTS[domain] ? `http://${DEBUG_ENDPOINTS[domain]}` : `https://${domain}`
}

export function AVATAR_URL (userId) {
  const {domain, username} = parseUserId(userId)
  return joinPath(HTTP_ENDPOINT(domain), 'ctzn/avatar', username)
}

export function POST_URL (post) {
  return '/' + joinPath(post.author.userId, 'ctzn.network/post', post.key)
}

export const PERM_DESCRIPTIONS = {
  'ctzn.network/perm-community-ban': `Can remove, ban, and unban members from a community.`,
  'ctzn.network/perm-community-remove-post': `Can remove posts from the community's feed index.`,
  'ctzn.network/perm-community-edit-profile': `Can edit the profile of the community.`,
  'ctzn.network/perm-community-manage-roles': `Can create, edit, and delete roles.`,
  'ctzn.network/perm-community-assign-roles': `Can assign roles to community members.`
}