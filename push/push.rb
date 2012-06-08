require 'mechanize'
require 'logger'
require 'json'

module Push
  LOGIN_URL  = 'https://katama-qa.brightcove.com/'
  LOGIN_USER = 'jstreb@brightcove.com'
  LOGIN_PASS = 'joejoe'
  PUSH_URL   = 'https://katama-qa.brightcove.com/notifications'
  DEBUG      = true

  def self.it(message, pairs=nil, scheduled_at=nil)
    pairs = if pairs.nil?
      []
    else
      JSON.parse(pairs)
    end
    scheduled_at = Time.now if scheduled_at.nil?

    # Create Mechanize agent
    agent = Mechanize.new

    # Log to STDERR
    if DEBUG 
      agent.log = Logger.new(STDERR)
    end

    # katama-qa has invalid certs, disable SSL verification.
    agent.verify_mode = OpenSSL::SSL::VERIFY_NONE

    # katama_studio requires a webkit user-agent.
    agent.user_agent_alias = 'Mac Safari'

    # Sign in via maitred
    # ===================
    #
    # The strategy will be to set the `redirect` to the `Notifications` section in 
    # order to eliminate an extra request
    page = agent.get(LOGIN_URL, redirect: PUSH_URL)

    page = page.form do |f|
      f.email = LOGIN_USER     # Fill in email address
      f.password = LOGIN_PASS  # Fill in password
    end.click_button           # Submit form, will redirect to `Notifications`

    # Create a notification
    # =====================
    #
    # We need a valid CSRF
    csrf = page.at('head meta[name=csrf-token]').attributes['content'].value

    payload = {
      notification: {
        message: message,
        pairs: pairs,
        scheduled_at: scheduled_at.to_s,
        app_rendition_ids: ['4fcf569d0c1361087600011c'],
        geo_enabled: false,
        query_enabled: false,
        usage_enabled: false,
        state: 'scheduled'
      }
    }

    headers = { 
      'Content-Type' => 'application/json',  # POST requires a JSON request
      'X-CSRF-Token' => csrf                 # Rails requires valid CSRF token
    }

    # Issue request
    agent.post(PUSH_URL, payload.to_json, headers)
  end
end
