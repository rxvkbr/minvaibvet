#!/usr/bin/env ruby
# Adds the «VaibvetWidgets» WidgetKit extension to app/ios/App/App.xcodeproj and embeds it in the app.
# Safe to run again: does nothing if the target already exists.
#   ruby app/scripts/ios-add-widgets.rb
# Uses the xcodeproj gem that comes with CocoaPods.
require "xcodeproj"

root = File.expand_path("../ios/App", __dir__)
proj_path = File.join(root, "App.xcodeproj")
project = Xcodeproj::Project.open(proj_path)
NAME = "VaibvetWidgets"

SOURCES = Dir.children(File.join(root, NAME)).select { |f| f.end_with?(".swift") }.sort

existing = project.targets.find { |t| t.name == NAME }
if existing
  # the target is there: make sure every .swift file of the folder is compiled (new games get added here)
  group = project.main_group.find_subpath(NAME, false)
  have = existing.source_build_phase.files_references.map { |r| r && File.basename(r.path.to_s) }
  added = (SOURCES - have).each { |f| existing.add_file_references([group.new_reference(f)]) }
  project.save if added.any?
  puts "#{NAME}: already in the project" + (added.any? ? ", added #{added.join(", ")}" : "")
  exit 0
end

app = project.targets.find { |t| t.name == "App" } or abort("App target not found")
team = app.build_configurations.map { |c| c.build_settings["DEVELOPMENT_TEAM"] }.compact.first

ext = project.new_target(:app_extension, NAME, :ios, "17.0", nil, :swift)
group = project.main_group.find_subpath(NAME, true)
group.set_source_tree("<group>")
group.set_path(NAME)
SOURCES.each { |f| ext.add_file_references([group.new_reference(f)]) }
group.new_reference("Info.plist")

ext.build_configurations.each do |c|
  s = c.build_settings
  s["PRODUCT_BUNDLE_IDENTIFIER"] = "ua.pp.minvaibvet.widgets"
  s["PRODUCT_NAME"] = "$(TARGET_NAME)"
  s["INFOPLIST_FILE"] = "#{NAME}/Info.plist"
  s["IPHONEOS_DEPLOYMENT_TARGET"] = "17.0"
  s["SWIFT_VERSION"] = "5.0"
  s["TARGETED_DEVICE_FAMILY"] = "1,2"
  s["MARKETING_VERSION"] = "1.0"
  s["CURRENT_PROJECT_VERSION"] = "1"
  s["CODE_SIGN_STYLE"] = "Automatic"
  s["DEVELOPMENT_TEAM"] = team if team
  s["SKIP_INSTALL"] = "YES"
  s["GENERATE_INFOPLIST_FILE"] = "NO"
  s["LD_RUNPATH_SEARCH_PATHS"] = ["$(inherited)", "@executable_path/Frameworks", "@executable_path/../../Frameworks"]
  s["APPLICATION_EXTENSION_API_ONLY"] = "YES"
end
%w[WidgetKit SwiftUI AppIntents].each do |fw|
  ext.frameworks_build_phase.add_file_reference(project.frameworks_group.new_file("System/Library/Frameworks/#{fw}.framework", :sdk_root), true)
end

app.add_dependency(ext)
embed = app.copy_files_build_phases.find { |p| p.name == "Embed Foundation Extensions" } || app.new_copy_files_build_phase("Embed Foundation Extensions")
embed.symbol_dst_subfolder_spec = :plug_ins
bf = embed.add_file_reference(ext.product_reference, true)
bf.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }

project.save
puts "#{NAME}: added (bundle id ua.pp.minvaibvet.widgets, iOS 17+), embedded in App"
