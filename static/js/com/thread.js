import { LitElement, html } from '../../vendor/lit-element/lit-element.js'
import { repeat } from '../../vendor/lit-element/lit-html/directives/repeat.js'
import * as toast from './toast.js'
import { getPost, getThread } from '../lib/getters.js'
import * as session from '../lib/session.js'
import './post.js'
import './composer.js'

export class Thread extends LitElement {
  static get properties () {
    return {
      subject: {type: Object},
      isFullPage: {type: Boolean, attribute: 'full-page'},
      setDocumentTitle: {type: Boolean, attribute: 'set-document-title'},
      post: {type: Object},
      thread: {type: Array},
      isReplying: {type: Boolean}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.subject = undefined
    this.isFullPage = false
    this.setDocumentTitle = false
    this.replyCount = 0
    this.post = undefined
    this.thread = undefined
    this.isReplying = false
    this.isLoading = false
  }

  reset () {
    this.post = undefined
    this.thread = undefined
    this.replyCount = 0
  }

  get subjectSchemaId () {
    const urlp = new URL(this.subject.dbUrl)
    const pathParts = urlp.pathname.split('/')
    return pathParts.slice(3, -1).join('/')
  }

  async load () {
    this.isLoading = true
    // this.reset() TODO causes a flash of the loading spinner, needed?
    console.log('loading', this.subject)
    try {
      let post = await getPost(this.subject.authorId, this.subject.dbUrl)
      if (post.value.reply) {
        this.post = await getPost(post.value.reply.root.authorId, post.value.reply.root.dbUrl)
        this.thread = await getThread(post.value.reply.root.authorId, post.value.reply.root.dbUrl)
      } else {
        this.post = post
        this.thread = await getThread(this.subject.authorId, this.subject.dbUrl)
      }
    } catch (e) {
      toast.create(e.message, 'error')
      console.error(e)
    }
    console.log(this.post)
    console.log(this.thread)
    this.isLoading = false
  }

  updated (changedProperties) {
    if (typeof this.post === 'undefined' && !this.isLoading) {
      this.load()
    } else if (changedProperties.has('subject') && changedProperties.get('subject') != this.subject) {
      this.load()
    }
  }

  scrollHighlightedPostIntoView () {
    try {
      this.shadowRoot.querySelector('.highlight').scrollIntoView()
    } catch {}
  }

  // rendering
  // =

  render () {
    return html`
      <div
        class="border border-gray-300 rounded px-4 mb-2 ${this.subject.dbUrl === this.post?.url ? 'highlight' : ''}"
      >
        ${this.post ? html`
          <ctzn-post
            .post=${this.post}
            noborders
            view-content-on-click
            @publish-reply=${this.onPublishReply}
          ></ctzn-post>
          ${this.subject.dbUrl === this.post?.url ? this.renderReplyBox() : ''}
        ` : html`
          <span class="spinner"></span>
        `}
      </div>
      ${this.thread ? html`
        <div class="pl-4 border-l border-gray-200">
          ${this.renderReplies(this.thread)}
        </div>
      ` : ''}
    `
  }

  renderReplies (replies) {
    if (!replies?.length) return ''
    return html`
      <div class="pl-4 border-l border-gray-200">
        ${repeat(replies, r => r.url, reply => {
          const isSubject = this.subject.dbUrl === reply.url
          return html`
          <div class="border border-gray-300 rounded px-4 mb-2 ${isSubject ? 'highlight' : ''}">
              <ctzn-post
                .post=${reply}
                noborders
                thread-view
                @publish-reply=${this.onPublishReply}
              ></ctzn-post>
              ${isSubject ? this.renderReplyBox() : ''}
            </div>
            ${reply.replies?.length ? this.renderReplies(reply.replies) : ''}
          `
        })}
      </div>
    `
  }

  renderReplyBox () {
    if (this.post?.value.community && !session.isInCommunity(this.post.value.community.userId)) {
      return html`
        <div class="mt-1 mb-4 ml-10">
          <div class="cursor-text py-2 px-5 rounded bg-white border border-gray-300 italic text-gray-500">
            Join <a href="/${this.post.value.community.userId}">${this.post.value.community.userId}</a> to reply.
          </div>
        </div>
      `
    }
    return html`
      <div class="mt-1 mb-4 ml-10">
        ${this.isReplying ? html`
          <ctzn-composer
            .subject=${{dbUrl: this.post.url, authorId: this.post.author.userId, community: this.post.value.community}}
            .parent=${this.subject}
            placeholder="Write your reply"
            @publish=${this.onPublishReply}
            @cancel=${this.onCancelReply}
          ></ctzn-composer>
        ` : html`
          <div class="cursor-text py-2 px-5 rounded bg-white border border-gray-300 italic text-gray-500" @click=${this.onStartReply}>
            Write your reply
          </div>
        `}
      </div>
    `
  }

  // events
  // =

  onStartReply (e) {
    this.isReplying = true
  }

  onPublishReply (e) {
    toast.create('Reply published', '', 10e3)
    this.load()
    this.isReplying = false
  }

  onCancelReply (e) {
    this.isReplying = false
  }
}

customElements.define('ctzn-thread', Thread)