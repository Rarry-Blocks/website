export default [
  {
    id: "tween",
    name: "Tween",
    xml: `<category name="Tween" colour="#32a2c0">
        <block type="tween_sprite_property">
          <value name="TO">
            <shadow type="math_number">
              <field name="NUM">100</field>
            </shadow>
          </value>
          <value name="DURATION">
            <shadow type="math_number">
              <field name="NUM">3</field>
            </shadow>
          </value>
        </block>
        <block type="tween_block">
          <value name="FROM">
            <shadow type="math_number">
              <field name="NUM">0</field>
            </shadow>
          </value>
          <value name="TO">
            <shadow type="math_number">
              <field name="NUM">100</field>
            </shadow>
          </value>
          <value name="DURATION">
            <shadow type="math_number">
              <field name="NUM">3</field>
            </shadow>
          </value>
        </block>
        <block type="tween_block_value"></block>
      </category>`,
  },
  {
    id: "pen",
    name: "Pen",
    xml: `<category name="Pen" colour="#0fbd8c">
        <block type="pen_down"></block>
        <block type="pen_up"></block>
        <block type="set_pen_color_combined">
          <value name="VALUE">
            <shadow type="text">
              <field name="TEXT">255,100,100</field>
            </shadow>
          </value>
        </block>
        <block type="set_pen_size">
          <value name="SIZE"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
        </block>
        <block type="clear_pen"></block>
      </category>`,
  },
  {
    id: "sets",
    name: "Sets",
    xml: `<category name="Sets" colour="#2cc2a9">
        <block type="sets_create_extendable"></block>
        <sep gap="50"></sep>
        <block type="sets_size"></block>
        <block type="sets_isEmpty"></block>
        <block type="sets_has">
          <value name="VALUE">
            <shadow type="text">
                <field name="TEXT"></field>
            </shadow>
          </value>
        </block>
        <block type="sets_add_return">
          <value name="VALUE">
            <shadow type="text">
                <field name="TEXT"></field>
            </shadow>
          </value>
        </block>
        <block type="sets_delete_return">
          <value name="VALUE">
            <shadow type="text">
                <field name="TEXT"></field>
            </shadow>
          </value>
        </block>
        <block type="sets_convert"></block>
        <block type="sets_merge"></block>
        <sep gap="50"></sep>
        <block type="sets_foreach">
          <value name="ITEM">
            <shadow type="sets_foreach_item"></shadow>
          </value>
        </block>
      </category>`,
  },
];