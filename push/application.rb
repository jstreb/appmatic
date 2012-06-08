require 'json'
require 'sinatra'
require 'sinatra/json'
require_relative 'push'

class PushAPI < Sinatra::Application
  ONE_WEEK = 60*60*24*7

  helpers Sinatra::JSON

  before do
    content_type :json
  end

  configure :development do
    require 'sinatra/reloader'
    register Sinatra::Reloader
  end

  def development?
    ENV['RACK_ENV'] == 'development'
  end

  post '/push' do
    scheduled_at = development? ? Time.now + ONE_WEEK : Time.now
    Push.it(params[:message], params[:pairs], scheduled_at)

    {status: 1}.to_json
  end
end
