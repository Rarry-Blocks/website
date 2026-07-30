function block(type, ...extra) {
  return `<block type="${type}">${extra?.join?.("")}</block>`;
}
function value(name, ...extra) {
  return `<value name="${name}">${extra?.join?.("")}</value>`;
}
function shadow(type, ...extra) {
  return `<shadow type="${type}">${extra?.join?.("")}</shadow>`;
}
function field(name, value) {
  return `<field name="${name}">${value}</field>`;
}
function label(text) {
  return `<label text="${text}"></label>`;
}
function sep(gap) {
  return gap ? `<sep gap="${gap}"></sep>` : `<sep></sep>`;
}
function shadowNumber(value = 10) {
  return `<shadow type="math_number">${field("NUM", value)}</shadow>`;
}
function shadowText(value = "") {
  return `<shadow type="text">${field("TEXT", value)}</shadow>`;
}
function shadowBoolean() {
  return `<shadow type="checkbox">${field("BOOL", "FALSE")}</shadow>`;
}

const Toolbox = `
  <category name="Events" colour="#E2C416">
    ${block("when_flag_clicked")}
    ${block("project_timer")}
    ${sep("50")}
    ${block("when_key_clicked")}
    ${block("when_stage_clicked")}
    ${block("when_timer_reaches")}
    ${block("every_seconds")}
    ${sep("50")}
    ${block("when_custom_event_triggered")}
    ${block("trigger_custom_event")}
  </category>

  <category name="Control" colour="#FFAB19">
    ${block("wait_block", value("AMOUNT", shadowNumber(2)))}
    ${sep("50")}
    ${block("controls_if", value("IF0", shadowBoolean()))}
    ${block("controls_switch", value("VALUE", shadowText()))}
    ${block("controls_switch_case")}
    ${sep("50")}
    ${block("controls_repeat_ext", value("TIMES", shadowNumber(3)))}
    ${block("controls_forever")}
    ${block("controls_whileUntil", value("BOOL", shadowBoolean()))}
    ${block(
      "controls_forLoop",
      value("VAR", shadow("controls_forLoop_var")),
      value("START", shadowNumber(1)),
      value("END", shadowNumber(10)),
    )}
    ${block("controls_flow_statements")}
    ${block("controls_stop_sprite", value("ID", shadow("controls_sprites_menu")))}
    ${block("controls_stopblock")}
    ${sep("50")}
    ${block("controls_whenstartasclone")}
    ${block("controls_createclone", value("ID", shadow("controls_sprites_menu")))}
    ${block("controls_delete_all_clones", value("ID", shadow("controls_sprites_menu")))}
    ${block("controls_delete_this_clone")}
    ${block("controls_is_clone")}
    ${block("controls_as_sprite", value("ID", shadow("controls_sprites_menu")))}
    ${sep("50")}
    ${block("controls_thread_create")}
    ${block("controls_run_instantly")}
  </category>

  <category name="Functions" colour="#FF6680" custom="FUNCTIONS_CATEGORY"></category>

  ${sep()}

  <category name="Motion" colour="#4C97FF">
    ${block("move_steps", value("STEPS", shadowNumber()))}
    ${block("goto_position", value("x", shadowNumber(0)), value("y", shadowNumber(0)))}
    ${block("set_position", value("AMOUNT", shadowNumber(0)))}
    ${block("change_position", value("AMOUNT", shadowNumber(0)))}
    ${block("get_position")}
    ${sep("50")}
    ${block("point_towards", value("x", shadowNumber(0)), value("y", shadowNumber(0)))}
    ${block("angle_set", value("AMOUNT", shadowNumber(0)))}
    ${block("angle_turn", value("AMOUNT", shadowNumber(15)))}
    ${block("get_angle")}
  </category>

  <category name="Looks" colour="#9966FF">
    ${block("looks_setVisibility_sprite", value("VISIBLE", shadowBoolean()))}
    ${block("looks_isVisible")}
    ${sep("50")}
    ${block("say_message", value("MESSAGE", shadowText("Hello!")))}
    ${block(
      "say_message_duration_waiting",
      value("MESSAGE", shadowText("Hello!")),
      value("DURATION", shadowNumber(2)),
    )}
    ${sep("50")}
    ${block("switch_costume", value("COSTUME", shadow("looks_costumes_menu")))}
    ${block("get_costume_size")}
    ${sep("50")}
    ${block("set_size", value("AMOUNT", shadowNumber(100)))}
    ${block("change_size", value("AMOUNT", shadowNumber(10)))}
    ${block("get_sprite_scale")}
  </category>

  <category name="Sounds" colour="#ff66ba">
    ${block("play_sound", value("name", shadow("sound_sounds_menu")))}
    ${block("stop_sound", value("name", shadow("sound_sounds_menu")))}
    ${block("stop_all_sounds")}
    ${sep("50")}
    ${block("set_sound_property", value("value", shadowNumber(100)))}
    ${block("get_sound_property")}
  </category>

  ${sep()}

  <category name="Operators" colour="#59ba57">
    ${label("Logic")}
    ${block("logic_compare")}
    ${block("logic_operation_extra", value("A", shadowBoolean()), value("B", shadowBoolean()))}
    ${block("logic_negate", value("BOOL", shadowBoolean()))}
    ${block("logic_ternary", value("IF", shadowBoolean()))}
    ${label("Math")}
    ${block("math_number", field("NUM", 0))}
    ${block("math_arithmetic", value("A", shadowNumber(5)), value("B", shadowNumber(2)))}
    ${block("math_single", value("NUM", shadowNumber(10)))}
    ${block("math_trig", value("NUM", shadowNumber(45)))}
    ${block("math_constant")}
    ${block("math_number_property", value("NUMBER_TO_CHECK", shadowNumber(10)))}
    ${block("math_round", value("NUM", shadowNumber(1.5)))}
    ${block("math_on_list")}
    ${block(
      "math_modulo",
      value("DIVIDEND", shadowNumber(10)),
      value("DIVISOR", shadowNumber(6)),
    )}
    ${block(
      "math_constrain",
      value("VALUE", shadowNumber(5)),
      value("LOW", shadowNumber(1)),
      value("HIGH", shadowNumber(10)),
    )}
    ${block(
      "math_random_int",
      value("FROM", shadowNumber(1)),
      value("TO", shadowNumber(10)),
    )}
    ${block("math_random_float")}
    ${label("Text")}
    ${block("text")}
    ${block("text_join_extendable")}
    ${block("text_length", value("VALUE", shadowText()))}
    ${block("text_isEmpty", value("VALUE", shadowText()))}
    ${block("text_indexOf", value("VALUE", shadowText()), value("FIND", shadowText()))}
    ${block("text_charAt", value("VALUE", shadowText()))}
    ${block("text_getSubstring", value("STRING", shadowText()))}
    ${block("text_changeCase", value("TEXT", shadowText()))}
    ${block("text_trim", value("TEXT", shadowText()))}
  </category>

  <category name="System" colour="#5CB1D6">
    ${block("key_pressed")}
    ${block("all_keys_pressed")}
    ${sep("50")}
    ${block("mouse_button_pressed")}
    ${block("mouse_over")}
    ${block("get_mouse_position")}
    ${sep("50")}
    ${block("window_size")}
    ${block("system_current_time")}
    ${block(
      "system_distance_direction",
      value("X1", shadow("get_position", field("MENU", "x"))),
      value("Y1", shadow("get_position", field("MENU", "y"))),
      value("X2", shadowNumber()),
      value("Y2", shadowNumber()),
    )}
    ${sep("50")}
    ${block("system_sprite_property", value("ID", shadow("system_sprites_menu")))}
    ${block("controls_clones_list", value("ID", shadow("system_sprites_menu")))}
    ${block("system_sprites_list")}
  </category>

  <category name="Lists" colour="#e35340">
    ${block("lists_extendable")}
    ${block("lists_repeat", value("NUM", shadowNumber(5)))}
    ${sep("50")}
    ${block("lists_length")}
    ${block("lists_isEmpty")}
    ${block("lists_has", value("VALUE", shadowText()))}
    ${block("lists_indexOf")}
    ${block(
      "lists_find",
      value("item", shadow("lists_filter_item")),
      value("method", block("logic_compare", field("OP", "EQ"))),
    )}
    ${block("lists_getIndex_modified")}
    ${block("lists_setIndex_modified")}
    ${block("lists_getSublist")}
    ${block("lists_split", value("DELIM", shadowText(",")))}
    ${block("lists_merge")}
    ${block("lists_sort")}
    ${block(
      "lists_filter",
      value("item", shadow("lists_filter_item")),
      value("method", block("logic_compare", field("OP", "EQ"))),
    )}
    ${block(
      "lists_map",
      value("item", shadow("lists_filter_item")),
      value("method", block("lists_filter_item")),
    )}
    ${sep("50")}
    ${block(
      "lists_foreach",
      value("ITEM", shadow("lists_filter_item")),
      value("INDEX", shadow("lists_foreach_index")),
    )}
  </category>

  <category name="Objects" colour="#ff8349">
    ${block("json_create_statement")}
    ${block(
      "json_key_value_statement",
      value("KEY", shadowText("")),
      value("VALUE", shadowText("")),
    )}
    ${sep("50")}
    ${block("json_length")}
    ${block("json_isEmpty")}
    ${block("json_has_key", value("KEY", shadowText("key")))}
    ${block("json_get", value("KEY", shadowText("key")))}
    ${block("json_set_return", value("KEY", shadowText("key")))}
    ${block("json_delete_return", value("KEY", shadowText("key")))}
    ${block("json_property_list")}
    ${block("json_parse")}
    ${block("json_clone")}
  </category>

  <category name="Variables" colour="#FF8C1A" custom="GLOBAL_VARIABLES"></category>
`;

export default Toolbox;
