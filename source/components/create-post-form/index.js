import React from 'react'
import PropTypes from 'prop-types'
import withForm from 'constructicon/with-form'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import values from 'lodash/values'
import form from './form'
import { createPost } from '../../api/posts'
import { uploadImage } from '../../api/images'

import Form from 'constructicon/form'
import Grid from 'constructicon/grid'
import GridColumn from 'constructicon/grid-column'
import InputField from 'constructicon/input-field'
import InputImage from 'constructicon/input-image'
import InputModal from './InputModal'
import InputVideo from 'constructicon/input-video'
import Section from 'constructicon/section'

class CreatePostForm extends React.Component {
  constructor (props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
      errors: [],
      height: props.height,
      image: null,
      status: null,
      video: null,
      width: props.width
    }
  }

  handleSubmit (e) {
    e.preventDefault()

    const { video } = this.state
    const { form, onSuccess, pageId, token, userId } = this.props

    form.submit().then(data =>
      Promise.resolve()
        .then(
          () =>
            values(data).every(isEmpty) &&
            Promise.reject({
              message: 'Please include a message or an image or video.'
            })
        )
        .then(() => this.setState({ status: 'fetching' }))
        .then(() => data.image && uploadImage(data.image))
        .then(image =>
          createPost({
            ...data,
            image,
            pageId,
            token,
            userId,
            video: video ? video.url : data.video
          })
        )
        .then(data => {
          this.setState({ status: 'fetched' })
          onSuccess(data)
        })
        .catch(error => {
          const message =
            get(error, 'data.error.message') ||
            get(error, 'data.errorMessage') ||
            get(error, 'message') ||
            'There was an unexpected error'
          this.setState({ status: 'failed', errors: [{ message }] })
        })
    )
  }

  handleChangeAttachment (val, field = 'image') {
    const { form, height, resizeOnUpload, width } = this.props

    if (!val) {
      this.setState({ [field]: null, width, height })
      return form.fields[field].onChange('')
    }

    switch (typeof val) {
      case 'object':
        return this.setState({ [field]: val })
      default:
        if (resizeOnUpload && field === 'image') {
          const image = new window.Image()
          image.src = val
          image.onload = () => {
            this.setState({ width: image.width, height: image.height })
          }
        }

        return form.fields[field].onChange(val)
    }
  }

  render () {
    const { errors, height, image, status, video, width } = this.state
    const {
      buttonProps,
      form,
      formProps,
      inputProps,
      orientationChange,
      resizeOnUpload,
      submit
    } = this.props

    return (
      <Form
        errors={errors}
        isLoading={status === 'fetching'}
        noValidate
        onSubmit={this.handleSubmit}
        submit={submit}
        autoComplete='off'
        {...formProps}
      >
        <InputField {...form.fields.message} {...inputProps} />
        <Section tag='fieldset' spacing={{ b: 1 }}>
          <Grid spacing={0.5}>
            <GridColumn sm={6}>
              <InputModal
                buttonProps={buttonProps}
                data={image ? { image, preview: form.values.image } : null}
                type='image'
              >
                <InputImage
                  {...inputProps}
                  {...form.fields.image}
                  orientationChange={orientationChange}
                  resizeOnUpload={resizeOnUpload}
                  width={width}
                  height={height}
                  onChange={val => this.handleChangeAttachment(val, 'image')}
                  onFileChange={val =>
                    this.handleChangeAttachment(val, 'image')
                  }
                />
              </InputModal>
            </GridColumn>
            <GridColumn sm={6}>
              <InputModal
                buttonProps={buttonProps}
                data={video}
                type='video'
                width={20}
              >
                <InputVideo
                  {...inputProps}
                  {...form.fields.video}
                  onChange={val => this.handleChangeAttachment(val, 'video')}
                  onVideoChange={val =>
                    this.handleChangeAttachment(val, 'video')
                  }
                />
              </InputModal>
            </GridColumn>
          </Grid>
        </Section>
      </Form>
    )
  }
}

CreatePostForm.defaultProps = {
  height: 900,
  onSuccess: () => {},
  orientationChange: true,
  resizeOnUpload: true,
  submit: 'Post Update',
  width: 1200
}

CreatePostForm.propTypes = {
  /**
   * Props to be passed to the Button component
   */
  buttonProps: PropTypes.object,

  /**
   * Props to be passed to the Card component
   */
  cardProps: PropTypes.object,

  /**
   * Props to be passed to the Form component
   */
  formProps: PropTypes.object,

  /**
   * Image height in pixels
   */
  height: PropTypes.number,

  /**
   * Props to be passed to the Input components
   */
  inputProps: PropTypes.object,

  /*
   *
   */
  onSuccess: PropTypes.func,

  /**
   * The page id to create the post for
   */
  pageId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,

  /**
   * The page owner's user token
   */
  token: PropTypes.string.isRequired,

  /**
   * The label for the form submit button
   */
  submit: PropTypes.string,

  /**
   * The page owner id (required for JG)
   */
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  /**
   * Image width in pixels
   */
  width: PropTypes.number
}

export default withForm(form)(CreatePostForm)
