function block(type, ...extra) {
  return `<block type="${type}">${extra?.join?.("")}</block>`;
}
function value(name, ...extra) {
  return `<value name="${name}">${extra?.join?.("")}</value>`;
}
function shadow(type, ...extra) {
  return `<shadow type="${type}">${extra?.join?.("")}</shadow>`;
}
function sep(sep) {
  return `<sep gap="${sep}"></sep>`;
}
function shadowNumber(value = 10) {
  return `<shadow type="math_number"><field name="NUM">${value}</field></shadow>`;
}
function shadowText(value = "") {
  return `<shadow type="text"><field name="TEXT">${value}</field></shadow>`;
}
function shadowBoolean(value = true) {
  return `<shadow type="logic_boolean"><field name="BOOL">${value ? "TRUE" : "FALSE"}</field></shadow>`;
}

const Toolbox = `
  <category name="Events" colour="#ffc400">
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
    <block type="wait_block">
      <value name="AMOUNT">
        ${shadowNumber(2)}
      </value>
    </block>
    ${sep("50")}
    ${block("controls_if")}
    ${block("controls_switch", value("VALUE", shadowText()))}
    ${block("controls_switch_case")}
    ${sep("50")}
    <block type="controls_repeat_ext">
      <value name="TIMES">
        ${shadowNumber(3)}
      </value>
    </block>
    ${block("controls_forever")}
    ${block("controls_whileUntil")}
    <block type="controls_forLoop">
      <value name="VAR">
        ${shadow("controls_forLoop_var")}
      </value>
      <value name="START">
        ${shadowNumber(1)}
      </value>
      <value name="END">
        ${shadowNumber(10)}
      </value>
    </block>
    ${block("controls_flow_statements")}
    ${block("controls_stop_sprite", value("ID", shadow("controls_sprites_menu")))}
    ${block("controls_stopblock")}
    ${sep("50")}
    ${block("controls_whenstartasclone")}
    <block type="controls_createclone">
      <value name="ID">
        ${shadow("controls_sprites_menu")}
      </value>
    </block>
    <block type="controls_delete_all_clones">
      <value name="ID">
        ${shadow("controls_sprites_menu")}
      </value>
    </block>
    ${block("controls_delete_this_clone")}
    ${block("controls_is_clone")}
    <block type="controls_as_sprite">
      <value name="ID">
        ${shadow("controls_sprites_menu")}
      </value>
    </block>
    ${sep("50")}
    ${block("controls_thread_create")}
    ${block("controls_run_instantly")}
  </category>

  <category name="Functions" colour="#FF6680" custom="FUNCTIONS_CATEGORY"></category>
  
  <sep></sep>

  <category name="Motion" colour="#4C97FF">
    <block type="move_steps">
      <value name="STEPS">
        ${shadowNumber()}
      </value>
    </block>
    <block type="goto_position">
      <value name="x">
        ${shadowNumber(0)}
      </value>
      <value name="y">
        ${shadowNumber(0)}
      </value>
    </block>
    <block type="set_position">
      <value name="AMOUNT">
        ${shadowNumber(0)}
      </value>
    </block>
    <block type="change_position">
      <value name="AMOUNT">
        ${shadowNumber()}
      </value>
    </block>
    ${block("get_position")}
    ${sep("50")}
    <block type="point_towards">
      <value name="x">
        ${shadowNumber(0)}
      </value>
      <value name="y">
        ${shadowNumber(0)}
      </value>
    </block>
    <block type="angle_set">
      <value name="AMOUNT">
        ${shadowNumber(0)}
      </value>
    </block>
    <block type="angle_turn">
      <value name="AMOUNT">
        ${shadowNumber(15)}
      </value>
    </block>
    ${block("get_angle")}
  </category>

  <category name="Looks" colour="#9966FF">
    <block type="looks_setVisibility_sprite">
      <value name="VISIBLE">
        ${shadowBoolean(true)}
      </value>
    </block>
    ${block("looks_isVisible")}
    ${sep("50")}
    <block type="say_message">
      <value name="MESSAGE">
        ${shadowText("Hello!")}
      </value>
    </block>
    <block type="say_message_duration">
      <value name="MESSAGE">
        ${shadowText("Hello!")}
      </value>
      <value name="DURATION">
        ${shadowNumber(2)}
      </value>
    </block>
    ${sep("50")}
    <block type="switch_costume">
      <value name="COSTUME">
        ${shadow("looks_costumes_menu")}
      </value>
    </block>
    ${block("get_costume_size")}
    ${sep("50")}
    <block type="set_size">
      <value name="AMOUNT">
        ${shadowNumber(100)}
      </value>
    </block>
    <block type="change_size">
      <value name="AMOUNT">
        ${shadowNumber(10)}
      </value>
    </block>
    ${block("get_sprite_scale")}
  </category>

  <category name="Sounds" colour="#ff66ba">
    <block type="play_sound">
      <value name="name">
        ${shadow("sound_sounds_menu")}
      </value>
    </block>
    <block type="stop_sound">
      <value name="name">
        ${shadow("sound_sounds_menu")}
      </value>
    </block>
    ${block("stop_all_sounds")}
    ${sep("50")}
    <block type="set_sound_property">
      <value name="value">
        ${shadowNumber(100)}
      </value>
    </block>
    ${block("get_sound_property")}
  </category>

  <sep></sep>

  <category name="Operators" colour="#59ba57">
    <label text="Logic"></label>
    ${block("logic_compare")}
    ${block("logic_operation_extra")}
    ${block("logic_negate")}
    ${block("logic_boolean")}
    ${block("logic_ternary")}
    <label text="Math"></label>
    <block type="math_number">
      <field name="NUM">0</field>
    </block>
    <block type="math_arithmetic">
      <value name="A">
        ${shadowNumber(5)}
      </value>
      <value name="B">
        ${shadowNumber(2)}
      </value>
    </block>
    <block type="math_single">
      <value name="NUM">
        ${shadowNumber(10)}
      </value>
    </block>
    <block type="math_trig">
      <value name="NUM">
        ${shadowNumber(45)}
      </value>
    </block>
    ${block("math_constant")}
    <block type="math_number_property">
      <value name="NUMBER_TO_CHECK">
        ${shadowNumber(10)}
      </value>
    </block>
    <block type="math_round">
      <value name="NUM">
        ${shadowNumber(1.5)}
      </value>
    </block>
    ${block("math_on_list")}
    <block type="math_modulo">
      <value name="DIVIDEND">
        ${shadowNumber(10)}
      </value>
      <value name="DIVISOR">
        ${shadowNumber(6)}
      </value>
    </block>
    <block type="math_constrain">
      <value name="VALUE">
        ${shadowNumber(5)}
      </value>
      <value name="LOW">
        ${shadowNumber(1)}
      </value>
      <value name="HIGH">
        ${shadowNumber(10)}
      </value>
    </block>
    <block type="math_random_int">
      <value name="FROM">
        ${shadowNumber(1)}
      </value>
      <value name="TO">
        ${shadowNumber(10)}
      </value>
    </block>
    ${block("math_random_float")}
    <label text="Text"></label>
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
      value("X1", shadow("get_position", `<field name="MENU">x</field>`)),
      value("Y1", shadow("get_position", `<field name="MENU">y</field>`)),
      value("X2", shadowNumber()),
      value("Y2", shadowNumber()),
    )}
    ${sep("50")}
    ${block("system_sprite_property", value("ID", shadow("system_sprites_menu")))}
    ${block("controls_clones_list", value("ID", shadow("system_sprites_menu")))}
    ${block("system_sprites_list", value("ID", shadow("system_sprites_menu")))}
  </category>

  <category name="Lists" colour="#e35340">
    ${block("lists_extendable")}
    <block type="lists_repeat">
      <value name="NUM">
        ${shadowNumber(5)}
      </value>
    </block>
    ${sep("50")}
    ${block("lists_length")}
    ${block("lists_isEmpty")}
    ${block("lists_has", value("VALUE", shadowText()))}
    ${block("lists_indexOf")}
    <block type="lists_find">
      <value name="item">
        ${shadow("lists_filter_item")}
      </value>
      <value name="method">
        <block type="logic_compare">
          <field name="OP">EQ</field>
        </block>
      </value>
    </block>
    </value>
    ${block("lists_getIndex_modified")}
    ${block("lists_setIndex_modified")}
    ${block("lists_getSublist")}
    <block type="lists_split">
      <value name="DELIM">
        <shadow type="text">
          <field name="TEXT">,</field>
        </shadow>
      </value>
    </block>
    ${block("lists_merge")}
    ${block("lists_sort")}
    <block type="lists_filter">
      <value name="item">
        ${shadow("lists_filter_item")}
      </value>
      <value name="method">
        <block type="logic_compare">
          <field name="OP">EQ</field>
        </block>
      </value>
    </block>
    <block type="lists_map">
      <value name="item">
        ${shadow("lists_filter_item")}
      </value>
      <value name="method">
        ${block("lists_filter_item")}
      </value>
    </block>
    ${sep("50")}
    <block type="lists_foreach">
      <value name="ITEM">
        ${shadow("lists_filter_item")}
      </value>
      <value name="INDEX">
        ${shadow("lists_foreach_index")}
      </value>
    </block>
  </category>

  <category name="Objects" colour="#ff8349">
    ${block("json_create_statement")}
    <block type="json_key_value_statement">
      <value name="KEY">
        <shadow type="text">
          <field name="TEXT"></field>
        </shadow>
      </value>
      <value name="VALUE">
        <shadow type="text">
          <field name="TEXT"></field>
        </shadow>
      </value>
    </block>
    ${sep("50")}
    ${block("json_length")}
    ${block("json_isEmpty")}
    <block type="json_has_key">
      <value name="KEY">
        <shadow type="text">
          <field name="TEXT">key</field>
        </shadow>
      </value>
    </block>
    <block type="json_get">
      <value name="KEY">
        <shadow type="text">
          <field name="TEXT">key</field>
        </shadow>
      </value>
    </block>
    <block type="json_set_return">
      <value name="KEY">
        <shadow type="text">
          <field name="TEXT">key</field>
        </shadow>
      </value>
    </block>
    <block type="json_delete_return">
      <value name="KEY">
        <shadow type="text">
          <field name="TEXT">key</field>
        </shadow>
      </value>
    </block>
    ${block("json_property_list")}
    ${block("json_parse")}
    ${block("json_clone")}
  </category>

  <category name="Variables" colour="#FF8C1A" custom="GLOBAL_VARIABLES"></category>
`;

export default Toolbox;
