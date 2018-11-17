// https://www.npmjs.com/package/wpapi
import WPAPI from 'wpapi'
import moment from 'moment'

let wp = new WPAPI({
  endpoint: process.env.WP_API_URL
});

// Adds custom post type
wp.articulos = wp.registerRoute('wp/v2', '/articulos/(?P<id>)');

// Configuration
const DEFAULT_IMG = require('@/assets/china.png')

let makeArticles = function(items){
  return items.map(item => makeArticle(item))
}

let makeArticle = function(item){
  // Category
  let category = item._embedded && item._embedded['wp:term']
    ? item._embedded['wp:term'][0].find(
        term => term.taxonomy === 'category' && term.name !== 'Sin categoría'
      )
    : undefined

  // Image
  let image = item._embedded && item._embedded['wp:featuredmedia']
    ? item._embedded['wp:featuredmedia'].find(media => media.media_type === 'image')
    : undefined

  // Auhor
  let author = item._embedded && item._embedded.author && item._embedded.author[0]
    ? item._embedded.author[0]
    : undefined

  // PDfs
  let pdfs = []
  if(item.acf){
    for (var i = 1; i <= 6; i++) {
      if(item.acf['archivo_'+i]){
        pdfs.push(item.acf['archivo_'+i])
      }
    }
  }

  return {
    id: item.id,
    date: item.date ? moment(item.date).format('DD/MM/YYYY') : '',
    content: item.content.rendered,
    video: item.acf && item.acf.video_vimeo ? item.acf.video_vimeo : '',
    pdfs: pdfs.map(pdf => ({
      id: pdf.id,
      src: pdf.url,
      filename: pdf.name
    })),
    img: {
      src: (image && image.media_details) ? image.media_details.sizes.medium_large.source_url : '',
      alt: image ? image.alt_text : '',
      src_default: DEFAULT_IMG
    },
    artist: author ? author.name : '',
    title: item.title.rendered,
    category: category ? category.name : ''
  }
}

export default function(ctx, inject) {

  let api = {
    async getFeaturedArticles() {
      try {
        let items = await wp.articulos()
          .perPage(3)
          .order('asc')
          .param({status: 'publish'})
          .orderby('date')
          .embed()
        return makeArticles(items)

      }catch(e){
        console.log(e)
      }
    },

    async getArticles() {
      try {
        let items = await wp.articulos()
          .order('asc')
          .orderby('date')
          .param({status: 'publish'})
          .embed()
        return makeArticles(items)

      }catch(e){
        console.log(e)
      }
    },

    async getArticle(id) {
      try {
        let item = await wp.articulos()
          .id(id)
          .embed()
        return makeArticle(item)

      }catch(e){
        console.log(e)
      }
    }
  }

  inject('api', api)
}
