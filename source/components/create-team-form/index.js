import React from 'react'
import get from 'lodash/get'
import PropTypes from 'prop-types'
import withForm from 'constructicon/with-form'
import form from './form'
import { createTeam, deserializeTeam } from '../../api/teams'
import { isJustGiving } from '../../utils/client'
import { currencyCode } from '../../utils/currencies'

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

    const {
      campaign,
      country,
      form,
      pageId,
      pageSlug,
      token,
      onSuccess
    } = this.props

    return form.submit().then(data => {
      this.setState({ status: 'fetching' })

      const params = {
        campaignId: campaign,
        captainSlug: pageSlug,
        page: pageId,
        targetCurrency: currencyCode(country),
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
          const errors = this.buildErrors(error)
          this.setState({ status: 'failed', errors })
          return Promise.reject(error)
        })
    })
  }

  buildErrors (error) {
    const errors = get(error, 'data.error.errors', [])

    if (errors.length > 0 && !isJustGiving()) {
      return errors.map(err => {
        switch (err.code) {
          case 'taken':
            return {
              message:
                'That name has been taken. Please try with a different team name.'
            }
          default:
            return { message: `Team ${err.field} ${err.message}.` }
        }
      })
    }

    return [{ message: 'An error occurred creating your team.' }]
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
  token: PropTypes.string.isRequired,

  /**
   * The country the team is being created in (sets the currency)
   */
  country: PropTypes.string
}

export default withForm(form)(CreateTeamForm)
