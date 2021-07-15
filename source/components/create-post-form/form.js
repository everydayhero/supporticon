export default () => ({
  fields: {
    message: {
      label: 'Post an update',
      type: 'contenteditable'
    },
    image: {
      label: 'Attach an image'
    },
    video: {
      type: 'search',
      label: 'Enter a video URL (e.g. Youtube, Facebook, Vimeo)',
      placeholder: 'e.g. https://www.youtube.com/watch?v=yPw4GHqFV6U',
      autoFocus: true
    }
  }
})
