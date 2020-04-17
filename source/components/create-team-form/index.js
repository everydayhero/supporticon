import React from 'react'
import PropTypes from 'prop-types'
import withForm from 'constructicon/with-form'
import form from './form'
import { createTeam, deserializeTeam } from '../../api/teams'
import { isJustGiving } from '../../utils/client'

import Form from 'constructicon/form'
import InputField from 'constructicon/input-field'

class CreateTeamForm extends React.Component {
  constructor () {
    super()
    this.handleCreateTeam = this.handleCreateTeam.bind(this)
    this.state = { errors: [], status: null }
  }

  handleCreateTeam (e) {
    e.preventDefault()

    const { campaign, form, pageId, pageSlug, token, onSuccess } = this.props

    return form.submit().then(data => {
      this.setState({ status: 'fetching' })

      const params = {
        campaignId: campaign,
        captainSlug: pageSlug,
        page: pageId,
        token,
        ...data
      }

      return Promise.resolve()
        .then(() => createTeam(params))
        .then(team => deserializeTeam(team))
        .then(team => {
          this.setState({ status: 'fetched' })
          return onSuccess(team)
        })
        .catch(error => {
          const errors = [{ message: 'There was an unexpected error' }]
          this.setState({ status: 'failed', errors })
          return Promise.reject(error)
        })
    })
  }

  render () {
    const { errors, status } = this.state
    const { form, formProps, inputProps } = this.props

    return (
      <Form
        isLoading={status === 'fetching'}
        noValidate
        submit='Create Team'
        errors={errors}
        onSubmit={this.handleCreateTeam}
        {...formProps}
      >
        <InputField {...form.fields.name} {...inputProps} />
        {isJustGiving() && (
          <InputField {...form.fields.target} {...inputProps} />
        )}
        {isJustGiving() && (
          <InputField {...form.fields.story} {...inputProps} />
        )}
      </Form>
    )
  }
}

CreateTeamForm.propTypes = {
  /**
   * The campaignId you want to join teams in
   */
  campaign: PropTypes.string,

  /**
   * Props to be passed to the Form component
   */
  formProps: PropTypes.object,

  /**
   * Props to be passed to the InputField components
   */
  inputProps: PropTypes.object,

  /**
   * The onSuccess event handler
   */
  onSuccess: PropTypes.func.isRequired,

  /**
   * The page (id) you want to add to the team
   */
  pageId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  /**
   * The page (slug) you want to add to the team
   */
  pageSlug: PropTypes.string,

  /**
   * The logged in users' auth token
   */
  token: PropTypes.string.isRequired
}

export default withForm(form)(CreateTeamForm)
