#!/usr/bin/env ruby
# Adds the «VaibvetStickers» iMessage sticker pack to app/ios/App/App.xcodeproj and embeds it in the app.
# Safe to run again: does nothing if the target already exists. Runs on the Mac from ios-testflight.sh.
#   ruby app/scripts/ios-add-stickers.rb
require "xcodeproj"

root = File.expand_path("../ios/App", __dir__)
project = Xcodeproj::Project.open(File.join(root, "App.xcodeproj"))
NAME = "VaibvetStickers"
if project.targets.any? { |t| t.name == NAME }
  puts "#{NAME}: already in the project"; exit 0
end

app = project.targets.find { |t| t.name == "App" } or abort("App target not found")
team = app.build_configurations.map { |c| c.build_settings["DEVELOPMENT_TEAM"] }.compact.first

ext = project.new_target(:app_extension, NAME, :ios, "17.0", nil, nil)
ext.product_type = "com.apple.product-type.app-extension.messages-sticker-pack"
group = project.main_group.find_subpath(NAME, true)
group.set_source_tree("<group>")
group.set_path(NAME)
assets = group.new_reference("Stickers.xcassets")
group.new_reference("Info.plist")
ext.resources_build_phase.add_file_reference(assets, true)

ext.build_configurations.each do |c|
  s = c.build_settings
  s["PRODUCT_BUNDLE_IDENTIFIER"] = "ua.pp.minvaibvet.stickers"
  s["PRODUCT_NAME"] = "$(TARGET_NAME)"
  s["INFOPLIST_FILE"] = "#{NAME}/Info.plist"
  s["IPHONEOS_DEPLOYMENT_TARGET"] = "17.0"
  s["TARGETED_DEVICE_FAMILY"] = "1,2"
  s["MARKETING_VERSION"] = "1.0"
  s["CURRENT_PROJECT_VERSION"] = "1"
  s["CODE_SIGN_STYLE"] = "Automatic"
  s["DEVELOPMENT_TEAM"] = team if team
  s["SKIP_INSTALL"] = "YES"
  s["GENERATE_INFOPLIST_FILE"] = "NO"
  s["ASSETCATALOG_COMPILER_APPICON_NAME"] = "iMessage App Icon"
end

app.add_dependency(ext)
embed = app.copy_files_build_phases.find { |p| p.name == "Embed Foundation Extensions" } || app.new_copy_files_build_phase("Embed Foundation Extensions")
embed.symbol_dst_subfolder_spec = :plug_ins
bf = embed.add_file_reference(ext.product_reference, true)
bf.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }

project.save
puts "#{NAME}: added (bundle id ua.pp.minvaibvet.stickers), embedded in App"
